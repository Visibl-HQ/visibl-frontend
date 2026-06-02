"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  applyIngestion,
  createSourceItem,
  createUploadUrl,
} from "@/lib/api/ingestion"
import { createConversation } from "@/lib/api/projects"
import type {
  ApplyIngestionResponse,
  IngestionPreview,
  SourceType,
} from "@/lib/api/types"
import {
  getIngestionErrorMessage,
  isJobAlreadyAppliedError,
} from "@/features/ingestion/lib/ingestion-errors"
import { mergeIngestionPreviews } from "@/features/ingestion/lib/merge-ingestion-previews"
import { validateIngestionFile } from "@/features/ingestion/lib/file-validation"
import { uploadToPresignedUrl } from "@/features/ingestion/lib/upload-to-presigned-url"
import { waitForExtraction } from "@/features/ingestion/lib/wait-for-extraction"
import { isDraftConversationId } from "@/features/workspace/lib/conversation-routing"

export type IngestionPhase =
  | "idle"
  | "uploading"
  | "extracting"
  | "preview"
  | "applying"
  | "done"
  | "error"

type UseIngestionFlowOptions = {
  projectId: string
  conversationId: string
  onConversationCreated: (conversationId: string) => void | Promise<void>
  onApplySuccess: (result: ApplyIngestionResponse) => void | Promise<void>
  onActivityLabel: (label: string | null) => void
  onError: (message: string) => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return getIngestionErrorMessage(error, fallback)
}

export function useIngestionFlow({
  projectId,
  conversationId,
  onConversationCreated,
  onApplySuccess,
  onActivityLabel,
  onError,
}: UseIngestionFlowOptions) {
  const [phase, setPhase] = useState<IngestionPhase>("idle")
  const [preview, setPreview] = useState<IngestionPreview | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobIds, setJobIds] = useState<string[]>([])
  const [importCount, setImportCount] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const activeConversationIdRef = useRef(conversationId)

  useEffect(() => {
    activeConversationIdRef.current = conversationId
  }, [conversationId])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase("idle")
    setPreview(null)
    setJobId(null)
    setJobIds([])
    setImportCount(1)
    setError(null)
    onActivityLabel(null)
  }, [onActivityLabel])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase("idle")
    setPreview(null)
    setJobId(null)
    setJobIds([])
    setImportCount(1)
    setError(null)
    onActivityLabel(null)
  }, [onActivityLabel])

  const ensureConversationId = useCallback(async (): Promise<string> => {
    if (!isDraftConversationId(activeConversationIdRef.current)) {
      return activeConversationIdRef.current
    }

    const conversation = await createConversation(projectId)
    activeConversationIdRef.current = conversation.public_id
    await onConversationCreated(conversation.public_id)
    return conversation.public_id
  }, [onConversationCreated, projectId])

  const beginExtraction = useCallback(
    async (nextJobId: string) => {
      const controller = new AbortController()
      abortRef.current = controller
      setJobId(nextJobId)
      setPhase("extracting")
      onActivityLabel("Extracting context from import…")

      try {
        const nextPreview = await waitForExtraction(projectId, nextJobId, {
          signal: controller.signal,
          onStatus: (status) => {
            if (status === "pending") {
              onActivityLabel("Queued for extraction…")
            }
            if (status === "running") {
              onActivityLabel("Extracting context from import…")
            }
          },
        })

        if (controller.signal.aborted) {
          return
        }

        setPreview(nextPreview)
        setJobId(nextJobId)
        setJobIds([nextJobId])
        setImportCount(1)
        setPhase("preview")
        onActivityLabel(null)
      } catch (extractionError) {
        if (controller.signal.aborted) {
          return
        }

        const message = getErrorMessage(
          extractionError,
          "Could not extract context from import."
        )
        setError(message)
        setPhase("error")
        onActivityLabel(null)
        onError(message)
      }
    },
    [onActivityLabel, onError, projectId]
  )

  const startSingleFileIngestion = useCallback(
    async (file: File) => {
      const validation = validateIngestionFile(file)

      if (!validation.valid) {
        setError(validation.error)
        setPhase("error")
        onError(validation.error)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setPreview(null)
      setJobId(null)
      setJobIds([])
      setImportCount(1)
      setPhase("uploading")
      onActivityLabel("Uploading file…")

      try {
        const targetConversationId = await ensureConversationId()

        if (controller.signal.aborted) {
          return
        }

        const upload = await createUploadUrl(projectId, {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          conversation_id: targetConversationId,
        })

        await uploadToPresignedUrl(upload.upload_url, file, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        const enqueue = await createSourceItem(projectId, {
          conversation_id: targetConversationId,
          source_type: "file_upload",
          source_item_id: upload.source_item_id,
          file_key: upload.file_key,
          byte_size: file.size,
          original_filename: file.name,
          mime_type: file.type || "application/octet-stream",
        })

        await beginExtraction(enqueue.job_id)
      } catch (uploadError) {
        if (controller.signal.aborted) {
          return
        }

        const message = getErrorMessage(uploadError, "Could not upload file.")
        setError(message)
        setPhase("error")
        onActivityLabel(null)
        onError(message)
      }
    },
    [beginExtraction, ensureConversationId, onActivityLabel, onError, projectId]
  )

  const startFilesIngestion = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return
      }

      for (const file of files) {
        const validation = validateIngestionFile(file)

        if (!validation.valid) {
          setError(`${file.name}: ${validation.error}`)
          setPhase("error")
          onError(`${file.name}: ${validation.error}`)
          return
        }
      }

      if (files.length === 1) {
        await startSingleFileIngestion(files[0]!)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setPreview(null)
      setJobId(null)
      setJobIds([])
      setImportCount(files.length)
      setPhase("uploading")
      onActivityLabel(`Uploading ${files.length} files…`)

      try {
        const targetConversationId = await ensureConversationId()

        if (controller.signal.aborted) {
          return
        }

        const nextJobIds: string[] = []

        for (const [index, file] of files.entries()) {
          onActivityLabel(`Uploading file ${index + 1} of ${files.length}…`)

          const upload = await createUploadUrl(projectId, {
            filename: file.name,
            content_type: file.type || "application/octet-stream",
            conversation_id: targetConversationId,
          })

          await uploadToPresignedUrl(upload.upload_url, file, controller.signal)

          if (controller.signal.aborted) {
            return
          }

          const enqueue = await createSourceItem(projectId, {
            conversation_id: targetConversationId,
            source_type: "file_upload",
            source_item_id: upload.source_item_id,
            file_key: upload.file_key,
            byte_size: file.size,
            original_filename: file.name,
            mime_type: file.type || "application/octet-stream",
          })

          nextJobIds.push(enqueue.job_id)
        }

        setPhase("extracting")
        onActivityLabel(`Extracting ${files.length} imports…`)

        const previews = await Promise.all(
          nextJobIds.map((nextJobId, index) =>
            waitForExtraction(projectId, nextJobId, {
              signal: controller.signal,
              onStatus: (status) => {
                if (status === "pending") {
                  onActivityLabel(
                    `Queued import ${index + 1} of ${files.length}…`
                  )
                }
                if (status === "running") {
                  onActivityLabel(
                    `Extracting import ${index + 1} of ${files.length}…`
                  )
                }
              },
            })
          )
        )

        if (controller.signal.aborted) {
          return
        }

        setJobIds(nextJobIds)
        setJobId(nextJobIds[0] ?? null)
        setPreview(mergeIngestionPreviews(previews))
        setPhase("preview")
        onActivityLabel(null)
      } catch (uploadError) {
        if (controller.signal.aborted) {
          return
        }

        const message = getErrorMessage(uploadError, "Could not upload files.")
        setError(message)
        setPhase("error")
        onActivityLabel(null)
        onError(message)
      }
    },
    [
      ensureConversationId,
      onActivityLabel,
      onError,
      projectId,
      startSingleFileIngestion,
    ]
  )

  const startFileIngestion = startSingleFileIngestion

  const startPasteIngestion = useCallback(
    async (pasteText: string, sourceType: SourceType = "paste") => {
      const trimmed = pasteText.trim()

      if (!trimmed) {
        const message = "Paste some text to import."
        setError(message)
        setPhase("error")
        onError(message)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setPreview(null)
      setJobId(null)
      setPhase("extracting")
      onActivityLabel("Submitting pasted context…")

      try {
        const targetConversationId = await ensureConversationId()

        if (controller.signal.aborted) {
          return
        }

        const enqueue = await createSourceItem(projectId, {
          conversation_id: targetConversationId,
          source_type: sourceType,
          paste_text: trimmed,
        })

        await beginExtraction(enqueue.job_id)
      } catch (pasteError) {
        if (controller.signal.aborted) {
          return
        }

        const message = getErrorMessage(
          pasteError,
          "Could not import pasted context."
        )
        setError(message)
        setPhase("error")
        onActivityLabel(null)
        onError(message)
      }
    },
    [beginExtraction, ensureConversationId, onActivityLabel, onError, projectId]
  )

  const startExportIngestion = useCallback(
    async (
      transcriptMarkdown: string,
      provider: "chatgpt" | "claude",
      exportConversationId: string
    ) => {
      const trimmed = transcriptMarkdown.trim()

      if (!trimmed) {
        const message = "Select a conversation to import."
        setError(message)
        setPhase("error")
        onError(message)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setPreview(null)
      setJobId(null)
      setPhase("extracting")
      onActivityLabel("Submitting export conversation…")

      try {
        const targetConversationId = await ensureConversationId()

        if (controller.signal.aborted) {
          return
        }

        const enqueue = await createSourceItem(projectId, {
          conversation_id: targetConversationId,
          source_type: `${provider}_export`,
          paste_text: trimmed,
          export_conversation_id: exportConversationId,
        })

        await beginExtraction(enqueue.job_id)
      } catch (exportError) {
        if (controller.signal.aborted) {
          return
        }

        const message = getErrorMessage(
          exportError,
          "Could not import export conversation."
        )
        setError(message)
        setPhase("error")
        onActivityLabel(null)
        onError(message)
      }
    },
    [beginExtraction, ensureConversationId, onActivityLabel, onError, projectId]
  )

  const applyPreview = useCallback(async () => {
    const pendingJobIds = jobIds.length > 0 ? jobIds : jobId ? [jobId] : []

    if (pendingJobIds.length === 0) {
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setPhase("applying")
    onActivityLabel(
      pendingJobIds.length > 1
        ? `Applying ${pendingJobIds.length} imports…`
        : "Applying import to workspace…"
    )

    try {
      let result: ApplyIngestionResponse | null = null

      for (const [index, pendingJobId] of pendingJobIds.entries()) {
        if (pendingJobIds.length > 1) {
          onActivityLabel(
            `Applying import ${index + 1} of ${pendingJobIds.length}…`
          )
        }

        result = await applyIngestion(projectId, pendingJobId)
      }

      if (!result) {
        return
      }

      setPhase("done")
      onActivityLabel(null)
      await onApplySuccess(result)
      reset()
    } catch (applyError) {
      if (isJobAlreadyAppliedError(applyError)) {
        setPhase("done")
        onActivityLabel(null)
        onError(
          getIngestionErrorMessage(
            applyError,
            "This import was already applied."
          )
        )
        reset()
        return
      }

      const message = getErrorMessage(applyError, "Could not apply import.")
      setError(message)
      setPhase("error")
      onActivityLabel(null)
      onError(message)
    }
  }, [
    jobId,
    jobIds,
    onActivityLabel,
    onApplySuccess,
    onError,
    projectId,
    reset,
  ])

  const isBusy =
    phase === "uploading" || phase === "extracting" || phase === "applying"

  return {
    phase,
    preview,
    jobId,
    error,
    isBusy,
    startFileIngestion,
    startFilesIngestion,
    startPasteIngestion,
    startExportIngestion,
    applyPreview,
    cancel,
    reset,
    importCount,
  }
}
