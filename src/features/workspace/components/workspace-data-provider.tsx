"use client"

import { useCallback, useRef } from "react"
import type { ConversationRead } from "@/lib/api/types"
import { hydrateMissingConversationPreviews } from "@/features/workspace/lib/conversation-previews"
import {
  loadProjectGlobals,
  loadProjectSectionGlobals,
  loadProjectSidebarData,
  type NonChatWorkspaceSection,
  type ProjectGlobals,
  type ProjectSectionGlobals,
  type ProjectSidebarData,
  type WorkspaceSliceState,
} from "@/features/workspace/lib/workspace-loader"
import {
  createProjectCacheEntry,
  isProjectCacheEntryFor,
  patchProjectCacheEntry,
  removeConversationFromProjectCache,
  type WorkspaceProjectCacheEntry,
  type WorkspaceProjectCachePatch,
} from "@/features/workspace/lib/workspace-cache"

export type { ProjectGlobals }

type ProjectSectionCacheEntry = ProjectSectionGlobals & {
  projectPublicId: string
}

function hasSectionSlice(
  slices: WorkspaceSliceState,
  section: NonChatWorkspaceSection
): boolean {
  return section === "company-map" ? slices.companyMap : slices.artifactHub
}

function cacheEntryFromGlobals(
  projectPublicId: string,
  globals: ProjectGlobals
): WorkspaceProjectCacheEntry {
  return createProjectCacheEntry({
    projectPublicId,
    projectCore: globals.project,
    conversationList: globals.conversations,
    companyMap: globals.companyMap,
    artifacts: globals.artifactHub,
  })
}

function globalsFromCacheEntry(
  entry: WorkspaceProjectCacheEntry
): ProjectGlobals {
  return {
    project: entry.projectCore,
    conversations: entry.conversationList,
    companyMap: entry.companyMap,
    artifactHub: entry.artifacts,
  }
}

function sectionGlobalsFromCacheEntry(
  entry: WorkspaceProjectCacheEntry
): ProjectSectionGlobals {
  return {
    project: entry.projectCore,
    companyMap: entry.companyMap,
    artifactHub: entry.artifacts,
    slices: {
      companyMap: true,
      artifactHub: true,
    },
  }
}

function mergeProjectSectionCache(
  current: ProjectSectionCacheEntry | null,
  projectPublicId: string,
  next: ProjectSectionGlobals
): ProjectSectionCacheEntry {
  if (!current || current.projectPublicId !== projectPublicId) {
    return {
      projectPublicId,
      ...next,
    }
  }

  return {
    projectPublicId,
    project: next.project,
    companyMap: next.slices.companyMap ? next.companyMap : current.companyMap,
    artifactHub: next.slices.artifactHub
      ? next.artifactHub
      : current.artifactHub,
    slices: {
      companyMap: current.slices.companyMap || next.slices.companyMap,
      artifactHub: current.slices.artifactHub || next.slices.artifactHub,
    },
  }
}

export function useProjectGlobals(projectPublicId: string) {
  const projectGlobalsRef = useRef<WorkspaceProjectCacheEntry | null>(null)
  const projectSidebarRef = useRef<
    (ProjectSidebarData & { projectPublicId: string }) | null
  >(null)
  const projectSectionGlobalsRef = useRef<ProjectSectionCacheEntry | null>(null)

  const ensureProjectGlobals =
    useCallback(async (): Promise<ProjectGlobals> => {
      if (isProjectCacheEntryFor(projectGlobalsRef.current, projectPublicId)) {
        return globalsFromCacheEntry(projectGlobalsRef.current)
      }

      const globals = await loadProjectGlobals(projectPublicId)
      const cacheEntry = cacheEntryFromGlobals(projectPublicId, globals)
      projectGlobalsRef.current = cacheEntry
      projectSidebarRef.current = {
        projectPublicId,
        conversations: globals.conversations,
      }
      projectSectionGlobalsRef.current = {
        projectPublicId,
        ...sectionGlobalsFromCacheEntry(cacheEntry),
      }
      return globals
    }, [projectPublicId])

  const ensureProjectSidebarData =
    useCallback(async (): Promise<ProjectSidebarData> => {
      if (isProjectCacheEntryFor(projectGlobalsRef.current, projectPublicId)) {
        return {
          conversations: projectGlobalsRef.current.conversationList,
        }
      }

      if (projectSidebarRef.current?.projectPublicId === projectPublicId) {
        return {
          conversations: projectSidebarRef.current.conversations,
        }
      }

      const sidebarData = await loadProjectSidebarData(projectPublicId)
      projectSidebarRef.current = {
        projectPublicId,
        ...sidebarData,
      }
      return sidebarData
    }, [projectPublicId])

  const ensureProjectSectionGlobals = useCallback(
    async (
      section: NonChatWorkspaceSection
    ): Promise<ProjectSectionGlobals> => {
      if (isProjectCacheEntryFor(projectGlobalsRef.current, projectPublicId)) {
        return sectionGlobalsFromCacheEntry(projectGlobalsRef.current)
      }

      const cached = projectSectionGlobalsRef.current

      if (
        cached?.projectPublicId === projectPublicId &&
        hasSectionSlice(cached.slices, section)
      ) {
        return cached
      }

      const sectionGlobals = await loadProjectSectionGlobals(
        projectPublicId,
        section
      )
      const merged = mergeProjectSectionCache(
        projectSectionGlobalsRef.current,
        projectPublicId,
        sectionGlobals
      )
      projectSectionGlobalsRef.current = merged
      return merged
    },
    [projectPublicId]
  )

  const invalidateProjectGlobals = useCallback(() => {
    projectGlobalsRef.current = null
    projectSidebarRef.current = null
    projectSectionGlobalsRef.current = null
  }, [])

  const patchProjectGlobals = useCallback(
    (patch: WorkspaceProjectCachePatch) => {
      projectGlobalsRef.current = patchProjectCacheEntry(
        projectGlobalsRef.current,
        patch
      )

      if (patch.conversationList) {
        projectSidebarRef.current = {
          projectPublicId,
          conversations: patch.conversationList,
        }
      }

      if (projectGlobalsRef.current) {
        projectSectionGlobalsRef.current = {
          projectPublicId,
          ...sectionGlobalsFromCacheEntry(projectGlobalsRef.current),
        }
        return
      }

      const sectionCache = projectSectionGlobalsRef.current

      if (sectionCache?.projectPublicId !== projectPublicId) {
        return
      }

      projectSectionGlobalsRef.current = {
        ...sectionCache,
        companyMap: patch.companyMap ?? sectionCache.companyMap,
        artifactHub: patch.artifacts ?? sectionCache.artifactHub,
        slices: {
          companyMap:
            sectionCache.slices.companyMap || Boolean(patch.companyMap),
          artifactHub:
            sectionCache.slices.artifactHub || Boolean(patch.artifacts),
        },
      }
    },
    [projectPublicId]
  )

  const forgetConversationInProjectGlobals = useCallback(
    (conversationId: string) => {
      projectGlobalsRef.current = removeConversationFromProjectCache(
        projectGlobalsRef.current,
        conversationId
      )
      projectSidebarRef.current =
        projectSidebarRef.current?.projectPublicId === projectPublicId
          ? {
              projectPublicId,
              conversations: projectSidebarRef.current.conversations.filter(
                (conversation) => conversation.public_id !== conversationId
              ),
            }
          : projectSidebarRef.current
    },
    [projectPublicId]
  )

  return {
    projectGlobalsRef,
    ensureProjectGlobals,
    ensureProjectSidebarData,
    ensureProjectSectionGlobals,
    invalidateProjectGlobals,
    patchProjectGlobals,
    forgetConversationInProjectGlobals,
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
