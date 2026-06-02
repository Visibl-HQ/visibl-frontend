import { getWorkspace } from "@/lib/api/projects"
import type { ConversationRead, WorkspaceRead } from "@/lib/api/types"
import { truncateConversationText } from "@/features/workspace/data/conversation-meta"

const STORAGE_PREFIX = "visibl-conversation-previews:"

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`
}

export function loadStoredConversationPreviews(
  projectId: string
): Record<string, string> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = sessionStorage.getItem(storageKey(projectId))
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === "string" && typeof entry[1] === "string"
      )
    )
  } catch {
    return {}
  }
}

export function persistConversationPreviews(
  projectId: string,
  previews: Record<string, string>
): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    sessionStorage.setItem(storageKey(projectId), JSON.stringify(previews))
  } catch {
    // Ignore quota or privacy-mode storage failures.
  }
}

export function extractConversationPreview(
  workspace: WorkspaceRead,
  max = 96
): string | null {
  const firstUserMessage = workspace.messages.find(
    (message) => message.role === "user"
  )

  if (!firstUserMessage?.content.trim()) {
    return null
  }

  return truncateConversationText(firstUserMessage.content, max)
}

export async function hydrateMissingConversationPreviews(input: {
  projectId: string
  conversations: ConversationRead[]
  activeConversationId: string
  knownPreviews: Record<string, string>
  onPreview: (conversationId: string, preview: string) => void
  signal?: AbortSignal
}): Promise<void> {
  const targets = input.conversations
    .filter((conversation) => {
      if (conversation.public_id === input.activeConversationId) {
        return false
      }

      if (conversation.title?.trim()) {
        return false
      }

      if (input.knownPreviews[conversation.public_id]) {
        return false
      }

      return true
    })
    .slice(0, 3)

  for (const conversation of targets) {
    if (input.signal?.aborted) {
      return
    }

    try {
      const workspace = await getWorkspace(
        input.projectId,
        conversation.public_id
      )

      if (input.signal?.aborted) {
        return
      }

      const preview = extractConversationPreview(workspace)

      if (preview) {
        input.onPreview(conversation.public_id, preview)
      }
    } catch {
      // Ignore per-conversation preview failures.
    }
  }
}
