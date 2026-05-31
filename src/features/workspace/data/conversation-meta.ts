import type { ConversationRead } from "@/lib/api/types"
import { formatRelativeDate } from "@/lib/format"

const DEMO_BRANCHES = [
  "main",
  "feat/customer",
  "explore/pricing",
  "spike/gtm",
  "refine/icp",
] as const

const DEMO_TAGS = ["intake", "v0.1", "review", "pivot", null] as const

export type ConversationGitMeta = {
  branch: string
  tag: string | null
}

/** Fallback git meta when idea history provider is not mounted. */
export function getConversationGitMeta(
  conversationId: string,
  index: number
): ConversationGitMeta {
  const hash = conversationId
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    branch: DEMO_BRANCHES[(hash + index) % DEMO_BRANCHES.length] ?? "main",
    tag: DEMO_TAGS[(hash + index) % DEMO_TAGS.length] ?? null,
  }
}

export function truncateConversationText(value: string, max = 50): string {
  const trimmed = value.trim()

  if (trimmed.length <= max) {
    return trimmed
  }

  return `${trimmed.slice(0, max).trimEnd()}…`
}

export function getConversationTitle(
  conversation: ConversationRead,
  preview?: string | null
): string {
  const savedTitle = conversation.title?.trim()

  if (savedTitle) {
    return savedTitle
  }

  if (preview?.trim()) {
    return truncateConversationText(preview, 50)
  }

  return "Untitled chat"
}

export function getConversationPreview(
  conversation: ConversationRead,
  preview?: string | null
): string | null {
  const savedTitle = conversation.title?.trim()
  const body = preview?.trim()

  if (!body) {
    return null
  }

  if (!savedTitle) {
    return body.length > 50 ? truncateConversationText(body, 96) : null
  }

  if (body !== savedTitle) {
    return truncateConversationText(body, 96)
  }

  return null
}

export function getConversationSubtitle(
  conversation: ConversationRead
): string {
  return formatRelativeDate(conversation.updated_at)
}

export function sortConversationsByRecent(
  conversations: ConversationRead[]
): ConversationRead[] {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )
}
