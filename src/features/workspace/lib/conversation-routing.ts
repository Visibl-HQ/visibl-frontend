export const DRAFT_CONVERSATION_ID = "new"

export function isDraftConversationId(
  conversationId: string | undefined
): boolean {
  return conversationId === DRAFT_CONVERSATION_ID
}

export { conversationPath, draftConversationPath } from "@/lib/routing/paths"

/** @deprecated Use conversationPath with username and projectSlug */
export function legacyConversationPath(
  projectPublicId: string,
  conversationId: string
): string {
  return `/projects/${projectPublicId}/conversations/${conversationId}`
}

/** @deprecated Use draftConversationPath with username and projectSlug */
export function legacyDraftConversationPath(projectPublicId: string): string {
  return `/projects/${projectPublicId}/conversations/${DRAFT_CONVERSATION_ID}`
}
