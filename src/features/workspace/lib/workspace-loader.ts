import {
  getCompanyMap,
  getProject,
  getWorkspace,
  listArtifacts,
  listConversations,
} from "@/lib/api/projects"
import type {
  ArtifactHubRead,
  CompanyMapRead,
  ConversationRead,
  ProjectRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { createDraftWorkspace } from "@/features/workspace/lib/empty-workspace"
import { sortConversationsByRecent } from "@/features/workspace/data/conversation-meta"

export type ProjectGlobals = {
  project: ProjectRead
  companyMap: CompanyMapRead
  artifactHub: ArtifactHubRead
  conversations: ConversationRead[]
}

export async function loadProjectGlobals(
  projectPublicId: string
): Promise<ProjectGlobals> {
  const [project, conversationPage, companyMap, artifactHub] =
    await Promise.all([
      getProject(projectPublicId),
      listConversations(projectPublicId, { limit: 20 }),
      getCompanyMap(projectPublicId),
      listArtifacts(projectPublicId),
    ])

  return {
    project,
    companyMap,
    artifactHub,
    conversations: sortConversationsByRecent(conversationPage.items),
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

export async function loadConversationWorkspace(
  projectPublicId: string,
  conversationPublicId: string
): Promise<WorkspaceRead> {
  return getWorkspace(projectPublicId, conversationPublicId)
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
