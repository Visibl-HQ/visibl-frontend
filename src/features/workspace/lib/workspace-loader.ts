import {
  getCompanyMap,
  getProject,
  getWorkspace,
  listArtifacts,
  listConversations,
  listPins,
} from "@/lib/api/projects"
import type {
  ArtifactHubRead,
  CompanyMapRead,
  ConversationRead,
  MemoryPinRead,
  ProjectRead,
  WorkspaceRead,
} from "@/lib/api/types"
import {
  createDraftWorkspace,
  createEmptyArtifactHub,
  createEmptyCompanyMap,
} from "@/features/workspace/lib/empty-workspace"
import { sortConversationsByRecent } from "@/features/workspace/data/conversation-meta"
import {
  getOrCreateRequest,
  invalidateRequestCache,
} from "@/features/workspace/lib/workspace-request-cache"
import { measureWorkspaceTiming } from "@/features/workspace/lib/workspace-timing"

function cachedProjectRequest<T>(
  key: string,
  action: () => Promise<T>
): Promise<T> {
  return getOrCreateRequest(key, action)
}

export type NonChatWorkspaceSection = "company-map" | "artifacts"

export type WorkspaceSliceState = {
  companyMap: boolean
  artifactHub: boolean
}

export type ProjectGlobals = {
  project: ProjectRead
  companyMap: CompanyMapRead
  artifactHub: ArtifactHubRead
  conversations: ConversationRead[]
}

export type ProjectSidebarData = {
  conversations: ConversationRead[]
}

export type ProjectCaptureData = {
  memoryPins: MemoryPinRead[]
  companyMap: CompanyMapRead
  artifactHub: ArtifactHubRead
}

export type ProjectSectionGlobals = {
  project: ProjectRead
  companyMap: CompanyMapRead
  artifactHub: ArtifactHubRead
  slices: WorkspaceSliceState
}

export async function loadProjectGlobals(
  projectPublicId: string
): Promise<ProjectGlobals> {
  const [project, sidebarData, companyMap, artifactHub] = await Promise.all([
    measureWorkspaceTiming(
      "project core",
      () =>
        cachedProjectRequest(`project:${projectPublicId}`, () =>
          getProject(projectPublicId)
        ),
      projectPublicId
    ),
    loadProjectSidebarData(projectPublicId),
    measureWorkspaceTiming(
      "company map",
      () =>
        cachedProjectRequest(`company-map:${projectPublicId}`, () =>
          getCompanyMap(projectPublicId)
        ),
      projectPublicId
    ),
    measureWorkspaceTiming(
      "artifacts",
      () =>
        cachedProjectRequest(`artifacts:${projectPublicId}`, () =>
          listArtifacts(projectPublicId)
        ),
      projectPublicId
    ),
  ])

  return {
    project,
    companyMap,
    artifactHub,
    conversations: sidebarData.conversations,
  }
}

export function buildDraftWorkspaceFromGlobals(
  globals: ProjectGlobals
): WorkspaceRead {
  return createDraftWorkspace(
    globals.project,
    globals.companyMap,
    globals.artifactHub
  )
}

export function buildDraftWorkspaceFromSectionGlobals(
  globals: ProjectSectionGlobals
): WorkspaceRead {
  return createDraftWorkspace(
    globals.project,
    globals.companyMap,
    globals.artifactHub
  )
}

export async function loadProjectSectionGlobals(
  projectPublicId: string,
  section: NonChatWorkspaceSection
): Promise<ProjectSectionGlobals> {
  if (section === "company-map") {
    const [project, companyMap] = await Promise.all([
      measureWorkspaceTiming(
        "project core",
        () =>
          cachedProjectRequest(`project:${projectPublicId}`, () =>
            getProject(projectPublicId)
          ),
        `${projectPublicId}:company-map`
      ),
      measureWorkspaceTiming(
        "company map",
        () =>
          cachedProjectRequest(`company-map:${projectPublicId}`, () =>
            getCompanyMap(projectPublicId)
          ),
        projectPublicId
      ),
    ])

    return {
      project,
      companyMap,
      artifactHub: createEmptyArtifactHub(projectPublicId),
      slices: {
        companyMap: true,
        artifactHub: false,
      },
    }
  }

  const [project, artifactHub] = await Promise.all([
    measureWorkspaceTiming(
      "project core",
      () =>
        cachedProjectRequest(`project:${projectPublicId}`, () =>
          getProject(projectPublicId)
        ),
      `${projectPublicId}:artifacts`
    ),
    measureWorkspaceTiming(
      "artifacts",
      () =>
        cachedProjectRequest(`artifacts:${projectPublicId}`, () =>
          listArtifacts(projectPublicId)
        ),
      projectPublicId
    ),
  ])

  return {
    project,
    companyMap: createEmptyCompanyMap(projectPublicId),
    artifactHub,
    slices: {
      companyMap: false,
      artifactHub: true,
    },
  }
}

export async function loadConversationWorkspace(
  projectPublicId: string,
  conversationPublicId: string
): Promise<WorkspaceRead> {
  return measureWorkspaceTiming(
    "conversation workspace",
    () =>
      cachedProjectRequest(
        `workspace:${projectPublicId}:${conversationPublicId}`,
        () => getWorkspace(projectPublicId, conversationPublicId)
      ),
    conversationPublicId
  )
}

export async function loadConversationChatBootstrap(
  projectPublicId: string,
  conversationPublicId: string
): Promise<WorkspaceRead> {
  return measureWorkspaceTiming(
    "chat bootstrap fetch",
    () =>
      cachedProjectRequest(
        `workspace:${projectPublicId}:${conversationPublicId}`,
        () => getWorkspace(projectPublicId, conversationPublicId)
      ),
    conversationPublicId
  )
}

export async function loadProjectSidebarData(
  projectPublicId: string
): Promise<ProjectSidebarData> {
  const conversationPage = await measureWorkspaceTiming(
    "sidebar list",
    () =>
      cachedProjectRequest(`sidebar:${projectPublicId}`, () =>
        listConversations(projectPublicId, {
          limit: 20,
        })
      ),
    projectPublicId
  )

  return {
    conversations: sortConversationsByRecent(conversationPage.items),
  }
}

export async function loadProjectCaptureData(
  projectPublicId: string,
  options?: { forceRefresh?: boolean }
): Promise<ProjectCaptureData> {
  if (options?.forceRefresh) {
    // The request cache memoizes forever; refresh-after-mutation must
    // invalidate or it re-reads pre-mutation data (generation, pins, and
    // candidate reviews would never appear without a hard reload).
    invalidateRequestCache(`pins:${projectPublicId}`)
    invalidateRequestCache(`company-map:${projectPublicId}`)
    invalidateRequestCache(`artifacts:${projectPublicId}`)
  }
  const [memoryPins, companyMap, artifactHub] = await Promise.all([
    cachedProjectRequest(`pins:${projectPublicId}`, () =>
      listPins(projectPublicId)
    ),
    measureWorkspaceTiming(
      "company map",
      () =>
        cachedProjectRequest(`company-map:${projectPublicId}`, () =>
          getCompanyMap(projectPublicId)
        ),
      `${projectPublicId}:capture`
    ),
    measureWorkspaceTiming(
      "artifacts",
      () =>
        cachedProjectRequest(`artifacts:${projectPublicId}`, () =>
          listArtifacts(projectPublicId)
        ),
      `${projectPublicId}:capture`
    ),
  ])

  return {
    memoryPins,
    companyMap,
    artifactHub,
  }
}

export function mergeConversationWithGlobals(
  bundle: WorkspaceRead,
  globals: ProjectGlobals
): WorkspaceRead {
  return {
    ...bundle,
    project: globals.project,
    company_map: globals.companyMap,
    artifact_hub: globals.artifactHub,
  }
}

export function mergeCaptureDataIntoWorkspace(
  workspace: WorkspaceRead,
  captureData: ProjectCaptureData
): WorkspaceRead {
  return {
    ...workspace,
    memory_pins: captureData.memoryPins,
    company_map: captureData.companyMap,
    artifact_hub: captureData.artifactHub,
  }
}
