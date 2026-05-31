import { apiJson } from "@/lib/api/client"
import type {
  BindingUpdateResponse,
  BranchRead,
  CheckpointRead,
  ConversationBindingRead,
  ConversationHistoryStatusRead,
  CreateBranchBody,
  CreateBranchResponse,
  CreateCheckpointBody,
  CreateOneOffBody,
  CursorPage,
  IdeaHistoryBootstrapRead,
  MergeBranchBody,
  MergeBranchResponse,
  OneOffSessionRead,
  SendOneOffMessageBody,
  UpdateBindingBody,
} from "@/lib/api/types"

function ideaHistoryPath(projectId: string, suffix = ""): string {
  return `/projects/${projectId}/idea-history${suffix}`
}

export async function fetchIdeaHistory(
  projectId: string
): Promise<IdeaHistoryBootstrapRead> {
  return apiJson<IdeaHistoryBootstrapRead>(ideaHistoryPath(projectId))
}

export async function listBranches(projectId: string): Promise<BranchRead[]> {
  return apiJson<BranchRead[]>(ideaHistoryPath(projectId, "/branches"))
}

export async function createBranch(
  projectId: string,
  body: CreateBranchBody
): Promise<CreateBranchResponse> {
  return apiJson<CreateBranchResponse>(
    ideaHistoryPath(projectId, "/branches"),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}

export async function listCheckpoints(
  projectId: string,
  params?: {
    branch_id?: string
    conversation_id?: string
    limit?: number
    cursor?: string
  }
): Promise<CursorPage<CheckpointRead>> {
  const searchParams = new URLSearchParams()

  if (params?.branch_id) {
    searchParams.set("branch_id", params.branch_id)
  }

  if (params?.conversation_id) {
    searchParams.set("conversation_id", params.conversation_id)
  }

  if (params?.limit) {
    searchParams.set("limit", String(params.limit))
  }

  if (params?.cursor) {
    searchParams.set("cursor", params.cursor)
  }

  const query = searchParams.toString()

  return apiJson<CursorPage<CheckpointRead>>(
    ideaHistoryPath(projectId, `/checkpoints${query ? `?${query}` : ""}`)
  )
}

export async function createCheckpoint(
  projectId: string,
  body: CreateCheckpointBody
): Promise<CheckpointRead> {
  return apiJson<CheckpointRead>(ideaHistoryPath(projectId, "/checkpoints"), {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function fetchBinding(
  projectId: string,
  conversationId: string
): Promise<ConversationBindingRead> {
  return apiJson<ConversationBindingRead>(
    ideaHistoryPath(projectId, `/conversations/${conversationId}/binding`)
  )
}

export async function updateBinding(
  projectId: string,
  conversationId: string,
  body: UpdateBindingBody
): Promise<BindingUpdateResponse> {
  return apiJson<BindingUpdateResponse>(
    ideaHistoryPath(projectId, `/conversations/${conversationId}/binding`),
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  )
}

export async function mergeBranch(
  projectId: string,
  branchId: string,
  body: MergeBranchBody
): Promise<MergeBranchResponse> {
  return apiJson<MergeBranchResponse>(
    ideaHistoryPath(projectId, `/branches/${branchId}/merge`),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}

export async function fetchConversationHistoryStatus(
  projectId: string,
  conversationId: string
): Promise<ConversationHistoryStatusRead> {
  return apiJson<ConversationHistoryStatusRead>(
    ideaHistoryPath(projectId, `/conversations/${conversationId}/status`)
  )
}

export async function createOneOffSession(
  projectId: string,
  body: CreateOneOffBody
): Promise<OneOffSessionRead> {
  return apiJson<OneOffSessionRead>(ideaHistoryPath(projectId, "/one-offs"), {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function sendOneOffMessage(
  projectId: string,
  sessionId: string,
  content: string
): Promise<OneOffSessionRead> {
  const body: SendOneOffMessageBody = { content }

  return apiJson<OneOffSessionRead>(
    ideaHistoryPath(projectId, `/one-offs/${sessionId}/messages`),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}
