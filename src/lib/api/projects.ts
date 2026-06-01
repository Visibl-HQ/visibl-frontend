import { apiJson } from "@/lib/api/client"
import type {
  ArtifactHubRead,
  ArtifactRead,
  CompanyMapCandidateRead,
  CompanyMapRead,
  ConversationRead,
  CreateConversationBody,
  CreateProjectBody,
  CursorPage,
  MemoryPinRead,
  MemoryPinUpdate,
  ProjectRead,
  ProjectSummaryRead,
  WorkspaceRead,
} from "@/lib/api/types"

export async function listProjects(params?: {
  limit?: number
  cursor?: string | null
}): Promise<CursorPage<ProjectSummaryRead>> {
  const searchParams = new URLSearchParams()

  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor)
  }

  const query = searchParams.toString()
  return apiJson<CursorPage<ProjectSummaryRead>>(
    `/projects/${query ? `?${query}` : ""}`
  )
}

export async function createProject(
  body: CreateProjectBody
): Promise<ProjectRead> {
  return apiJson<ProjectRead>("/projects/", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getProject(projectId: string): Promise<ProjectRead> {
  return apiJson<ProjectRead>(`/projects/${projectId}`)
}

export async function getCompanyMap(
  projectId: string
): Promise<CompanyMapRead> {
  return apiJson<CompanyMapRead>(`/projects/${projectId}/company-map`)
}

export async function listPins(projectId: string): Promise<MemoryPinRead[]> {
  return apiJson<MemoryPinRead[]>(`/projects/${projectId}/pins`)
}

export async function updatePin(
  projectId: string,
  pinId: string,
  body: MemoryPinUpdate
): Promise<MemoryPinRead> {
  return apiJson<MemoryPinRead>(`/projects/${projectId}/pins/${pinId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function confirmPin(
  projectId: string,
  pinId: string
): Promise<MemoryPinRead> {
  return apiJson<MemoryPinRead>(
    `/projects/${projectId}/pins/${pinId}/confirm`,
    { method: "POST" }
  )
}

export async function archivePin(
  projectId: string,
  pinId: string
): Promise<MemoryPinRead> {
  return apiJson<MemoryPinRead>(
    `/projects/${projectId}/pins/${pinId}/archive`,
    { method: "POST" }
  )
}

export async function promotePin(
  projectId: string,
  pinId: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/pins/${pinId}/promote`,
    { method: "POST" }
  )
}

export async function acceptCandidate(
  projectId: string,
  candidateId: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/accept`,
    { method: "POST" }
  )
}

export async function editAcceptCandidate(
  projectId: string,
  candidateId: string,
  value: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/edit-accept`,
    {
      method: "POST",
      body: JSON.stringify({ value }),
    }
  )
}

export async function rejectCandidate(
  projectId: string,
  candidateId: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/reject`,
    { method: "POST" }
  )
}

export async function archiveCandidate(
  projectId: string,
  candidateId: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/archive`,
    { method: "POST" }
  )
}

export async function clarifyCandidate(
  projectId: string,
  candidateId: string,
  question?: string
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/clarify`,
    {
      method: "POST",
      body: JSON.stringify({ question }),
    }
  )
}

export async function listArtifacts(
  projectId: string
): Promise<ArtifactHubRead> {
  return apiJson<ArtifactHubRead>(`/projects/${projectId}/artifacts`)
}

export async function getArtifact(
  projectId: string,
  artifactId: string
): Promise<ArtifactRead> {
  return apiJson<ArtifactRead>(`/projects/${projectId}/artifacts/${artifactId}`)
}

export async function listConversations(
  projectId: string,
  params?: { limit?: number; cursor?: string | null }
): Promise<CursorPage<ConversationRead>> {
  const searchParams = new URLSearchParams()

  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor)
  }

  const query = searchParams.toString()
  return apiJson<CursorPage<ConversationRead>>(
    `/projects/${projectId}/conversations/${query ? `?${query}` : ""}`
  )
}

export async function createConversation(
  projectId: string,
  body: CreateConversationBody = {}
): Promise<ConversationRead> {
  return apiJson<ConversationRead>(`/projects/${projectId}/conversations/`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function deleteConversation(
  projectId: string,
  conversationId: string
): Promise<void> {
  await apiJson<void>(
    `/projects/${projectId}/conversations/${conversationId}`,
    { method: "DELETE" }
  )
}

export async function getWorkspace(
  projectId: string,
  conversationId: string
): Promise<WorkspaceRead> {
  return apiJson<WorkspaceRead>(
    `/projects/${projectId}/conversations/${conversationId}/workspace`
  )
}
