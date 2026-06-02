"use client"

import { useCallback, useRef } from "react"
import type { ConversationRead } from "@/lib/api/types"
import { hydrateMissingConversationPreviews } from "@/features/workspace/lib/conversation-previews"
import {
  loadProjectGlobals,
  type ProjectGlobals,
} from "@/features/workspace/lib/workspace-loader"

export type { ProjectGlobals }

export function useProjectGlobals(projectPublicId: string) {
  const projectGlobalsRef = useRef<ProjectGlobals | null>(null)

  const ensureProjectGlobals =
    useCallback(async (): Promise<ProjectGlobals> => {
      if (projectGlobalsRef.current?.project.public_id === projectPublicId) {
        return projectGlobalsRef.current
      }

      const globals = await loadProjectGlobals(projectPublicId)
      projectGlobalsRef.current = globals
      return globals
    }, [projectPublicId])

  const invalidateProjectGlobals = useCallback(() => {
    projectGlobalsRef.current = null
  }, [])

  return {
    projectGlobalsRef,
    ensureProjectGlobals,
    invalidateProjectGlobals,
  }
}

type PreviewHydrationOptions = {
  projectPublicId: string
  rememberConversationPreview: (conversationId: string, preview: string) => void
  getKnownPreviews: () => Record<string, string>
}

export function useConversationPreviewHydration({
  projectPublicId,
  rememberConversationPreview,
  getKnownPreviews,
}: PreviewHydrationOptions) {
  const previewHydrationQueuedRef = useRef(false)
  const previewHydrationAbortRef = useRef<AbortController | null>(null)

  const queueConversationPreviewHydration = useCallback(
    (items: ConversationRead[], activeConversationId: string) => {
      if (previewHydrationQueuedRef.current) {
        return
      }

      previewHydrationQueuedRef.current = true
      previewHydrationAbortRef.current?.abort()
      const controller = new AbortController()
      previewHydrationAbortRef.current = controller

      void hydrateMissingConversationPreviews({
        projectId: projectPublicId,
        conversations: items,
        activeConversationId,
        knownPreviews: getKnownPreviews(),
        onPreview: rememberConversationPreview,
        signal: controller.signal,
      })
    },
    [getKnownPreviews, projectPublicId, rememberConversationPreview]
  )

  const abortPreviewHydration = useCallback(() => {
    previewHydrationAbortRef.current?.abort()
  }, [])

  return {
    queueConversationPreviewHydration,
    abortPreviewHydration,
  }
}
