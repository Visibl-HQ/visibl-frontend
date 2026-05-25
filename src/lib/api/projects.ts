import { apiJson } from "@/lib/api/client"
import type {
  ConversationRead,
  CreateConversationBody,
  CreateProjectBody,
  CursorPage,
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

export async function getWorkspace(
  projectId: string,
  conversationId: string
): Promise<WorkspaceRead> {
  return apiJson<WorkspaceRead>(
    `/projects/${projectId}/conversations/${conversationId}/workspace`
  )
}
