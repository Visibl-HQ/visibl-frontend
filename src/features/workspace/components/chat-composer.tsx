"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Paperclip, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatFileSize,
  validateIngestionFile,
} from "@/features/ingestion/lib/file-validation"
import {
  getFilesFromClipboard,
  getFilesFromDataTransfer,
} from "@/features/ingestion/lib/clipboard-files"

const MIN_HEIGHT = 44
const MAX_HEIGHT = 168

type ChatComposerProps = {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
  onExploreSeparately?: () => void
  onOpenIngestion?: () => void
  onImportFiles?: (files: File[]) => void | Promise<void>
  className?: string
}

export function ChatComposer({
  disabled = false,
  onSend,
  onExploreSeparately,
  onOpenIngestion,
  onImportFiles,
  className,
}: ChatComposerProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    const nextHeight = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, textarea.scrollHeight)
    )
    textarea.style.height = `${nextHeight}px`
  }, [content])

  async function importFiles(files: File[]) {
    if (!onImportFiles || files.length === 0 || disabled || isSubmitting) {
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      const validation = validateIngestionFile(file)

      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (validFiles.length === 0) {
      setImportError(errors.join(" "))
      return
    }

    setImportError(errors.length > 0 ? errors.join(" ") : null)
    setPendingFiles(validFiles)

    try {
      await onImportFiles(validFiles)
      setPendingFiles([])
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not import pasted files."
      )
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = content.trim()

    if (!trimmed || disabled || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setContent("")

    try {
      await onSend(trimmed)
    } catch {
      setContent(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSendDisabled = disabled || isSubmitting || !content.trim()

  return (
    <div className={cn("shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6", className)}>
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl"
        onDragEnter={(event) => {
          if (!onImportFiles) {
            return
          }

          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => {
          if (!onImportFiles) {
            return
          }

          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          if (!onImportFiles) {
            return
          }

          event.preventDefault()
          setDragActive(false)
          void importFiles(getFilesFromDataTransfer(event.dataTransfer))
        }}
      >
        {pendingFiles.length > 0 ? (
          <ul
            className="mb-2 flex flex-wrap gap-2"
            aria-label="Files queued for import"
          >
            {pendingFiles.map((file) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="bg-muted/40 border-border/70 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs"
              >
                <Paperclip
                  className="text-muted-foreground size-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate font-medium">{file.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatFileSize(file.size)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className={cn(
            "border-border/70 bg-card/50 focus-within:border-border flex items-end gap-2 rounded-[1.4rem] border px-3 py-2 shadow-sm transition-colors",
            dragActive && "border-brand/50 bg-brand/5",
            disabled && "opacity-70"
          )}
        >
          <label htmlFor="workspace-chat-input" className="sr-only">
            Message the assistant
          </label>
          {onOpenIngestion ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || isSubmitting}
              aria-label="Import context"
              className="mb-0.5 size-8 shrink-0 rounded-full"
              onClick={onOpenIngestion}
            >
              <Paperclip className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          <textarea
            ref={textareaRef}
            id="workspace-chat-input"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              onImportFiles
                ? "Ask anything, or paste files here to import context…"
                : "Ask anything about your startup…"
            }
            rows={1}
            disabled={disabled || isSubmitting}
            className="placeholder:text-muted-foreground/60 max-h-[168px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-6 outline-none"
            onPaste={(event) => {
              if (!onImportFiles) {
                return
              }

              const files = getFilesFromClipboard(event.clipboardData)

              if (files.length === 0) {
                return
              }

              event.preventDefault()
              void importFiles(files)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={isSendDisabled}
            aria-label="Send message"
            className="mb-0.5 size-8 shrink-0 rounded-full"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {importError ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
          >
            <p className="flex-1">{importError}</p>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss import error"
              onClick={() => setImportError(null)}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <p className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px]">
          <span>
            Visibl can make mistakes. Verify important claims before sharing.
          </span>
          {onImportFiles ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Paste or drop files into the chat box to import context.</span>
            </>
          ) : null}
          {onExploreSeparately ? (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onExploreSeparately}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                <Sparkles className="size-3" aria-hidden="true" />
                Explore a tangent separately
              </button>
            </>
          ) : null}
        </p>
      </form>
    </div>
  )
}
