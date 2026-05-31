export const DRAFT_CONVERSATION_ID = "new"

export function isDraftConversationId(
  conversationId: string | undefined
): boolean {
  return conversationId === DRAFT_CONVERSATION_ID
}

export function draftConversationPath(projectId: string): string {
  return `/projects/${projectId}/conversations/${DRAFT_CONVERSATION_ID}`
}

export function conversationPath(
  projectId: string,
  conversationId: string
): string {
  return `/projects/${projectId}/conversations/${conversationId}`
}
