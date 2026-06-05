import { apiJson } from "@/lib/api/client"
import type {
  ArtifactHubRead,
  ArtifactRead,
  ArtifactVersionPage,
  ArtifactVersionRead,
  CompanyMapCandidateRead,
  CompanyMapRead,
  ConversationRead,
  CreateConversationBody,
  CreateProjectBody,
  CursorPage,
  GenerationJobRead,
  MemoryPinRead,
  MemoryPinUpdate,
  ProjectRead,
  ProjectSummaryRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { normalizeMemoryPins } from "@/lib/api/normalize-memory-pin"

type CandidateReplaceOptions = {
  expected_revision_id?: string | null
  allow_replace?: boolean
}

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

export async function resolveProjectBySlug(
  username: string,
  projectSlug: string
): Promise<ProjectRead> {
  return apiJson<ProjectRead>(
    `/users/${encodeURIComponent(username)}/projects/${encodeURIComponent(projectSlug)}`
  )
}

export async function getCompanyMap(
  projectId: string
): Promise<CompanyMapRead> {
  return apiJson<CompanyMapRead>(`/projects/${projectId}/company-map`)
}

export async function listPins(projectId: string): Promise<MemoryPinRead[]> {
  const pins = await apiJson<MemoryPinRead[]>(`/projects/${projectId}/pins`)
  return normalizeMemoryPins(pins)
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
  candidateId: string,
  options?: CandidateReplaceOptions
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/accept`,
    {
      method: "POST",
      ...(options ? { body: JSON.stringify(options) } : {}),
    }
  )
}

export async function editAcceptCandidate(
  projectId: string,
  candidateId: string,
  value: string,
  options?: CandidateReplaceOptions
): Promise<CompanyMapCandidateRead> {
  return apiJson<CompanyMapCandidateRead>(
    `/projects/${projectId}/company-map/candidates/${candidateId}/edit-accept`,
    {
      method: "POST",
      body: JSON.stringify({ value, ...options }),
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

export async function generateArtifact(
  projectId: string,
  artifactId: string,
  body?: { idempotency_key?: string }
): Promise<GenerationJobRead> {
  return apiJson<GenerationJobRead>(
    `/projects/${projectId}/artifacts/${artifactId}/generate`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }
  )
}

export async function getGenerationJob(
  projectId: string,
  artifactId: string,
  jobId: string
): Promise<GenerationJobRead> {
  return apiJson<GenerationJobRead>(
    `/projects/${projectId}/artifacts/${artifactId}/generation-jobs/${jobId}`
  )
}

export async function listArtifactVersions(
  projectId: string,
  artifactId: string,
  params?: { limit?: number; cursor?: string | null }
): Promise<ArtifactVersionPage> {
  const searchParams = new URLSearchParams()
  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }
  if (params?.cursor) {
    searchParams.set("cursor", params.cursor)
  }
  const query = searchParams.toString()
  return apiJson<ArtifactVersionPage>(
    `/projects/${projectId}/artifacts/${artifactId}/versions${query ? `?${query}` : ""}`
  )
}

export async function getArtifactVersion(
  projectId: string,
  artifactId: string,
  versionId: string
): Promise<ArtifactVersionRead> {
  return apiJson<ArtifactVersionRead>(
    `/projects/${projectId}/artifacts/${artifactId}/versions/${versionId}`
  )
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
  const workspace = await apiJson<WorkspaceRead>(
    `/projects/${projectId}/conversations/${conversationId}/workspace`
  )

  return {
    ...workspace,
    memory_pins: normalizeMemoryPins(workspace.memory_pins),
  }
}
