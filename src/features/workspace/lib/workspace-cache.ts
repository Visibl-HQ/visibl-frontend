import type {
  ArtifactHubRead,
  CompanyMapRead,
  ConversationRead,
  MemoryPinRead,
  MessageRead,
  ProblemCustomerDocRead,
  ProjectRead,
  WorkspaceRead,
} from "@/lib/api/types"

export type WorkspaceProjectCacheEntry = {
  projectPublicId: string
  projectCore: ProjectRead
  conversationList: ConversationRead[]
  companyMap: CompanyMapRead
  artifacts: ArtifactHubRead
}

export type WorkspaceProjectCachePatch = Partial<
  Pick<
    WorkspaceProjectCacheEntry,
    "projectCore" | "conversationList" | "companyMap" | "artifacts"
  >
>

export type ConversationWorkspaceCacheEntry<
  TMessage extends MessageRead = MessageRead,
> = {
  workspace: WorkspaceRead
  messages: TMessage[]
  memoryPins: MemoryPinRead[]
  problemCustomerDoc: ProblemCustomerDocRead
}

export function createProjectCacheEntry(input: {
  projectPublicId: string
  projectCore: ProjectRead
  conversationList: ConversationRead[]
  companyMap: CompanyMapRead
  artifacts: ArtifactHubRead
}): WorkspaceProjectCacheEntry {
  return { ...input }
}

export function isProjectCacheEntryFor(
  entry: WorkspaceProjectCacheEntry | null,
  projectPublicId: string
): entry is WorkspaceProjectCacheEntry {
  return entry?.projectPublicId === projectPublicId
}

export function patchProjectCacheEntry(
  entry: WorkspaceProjectCacheEntry | null,
  patch: WorkspaceProjectCachePatch
): WorkspaceProjectCacheEntry | null {
  if (!entry) {
    return null
  }

  return {
    ...entry,
    ...patch,
  }
}

export function removeConversationFromProjectCache(
  entry: WorkspaceProjectCacheEntry | null,
  conversationId: string
): WorkspaceProjectCacheEntry | null {
  if (!entry) {
    return null
  }

  return {
    ...entry,
    conversationList: entry.conversationList.filter(
      (conversation) => conversation.public_id !== conversationId
    ),
  }
}

export function readConversationWorkspaceCache<
  TMessage extends MessageRead = MessageRead,
>(
  cache: Map<string, ConversationWorkspaceCacheEntry<TMessage>>,
  conversationId: string
): ConversationWorkspaceCacheEntry<TMessage> | null {
  return cache.get(conversationId) ?? null
}

export function writeConversationWorkspaceCache<
  TMessage extends MessageRead = MessageRead,
>(
  cache: Map<string, ConversationWorkspaceCacheEntry<TMessage>>,
  conversationId: string,
  entry: ConversationWorkspaceCacheEntry<TMessage>
): void {
  cache.set(conversationId, entry)
}

export function patchConversationWorkspaceCache<
  TMessage extends MessageRead = MessageRead,
>(
  cache: Map<string, ConversationWorkspaceCacheEntry<TMessage>>,
  conversationId: string,
  patcher: (
    entry: ConversationWorkspaceCacheEntry<TMessage>
  ) => ConversationWorkspaceCacheEntry<TMessage>
): void {
  const entry = cache.get(conversationId)

  if (!entry) {
    return
  }

  cache.set(conversationId, patcher(entry))
}

export function deleteConversationWorkspaceCache<
  TMessage extends MessageRead = MessageRead,
>(
  cache: Map<string, ConversationWorkspaceCacheEntry<TMessage>>,
  conversationId: string
): void {
  cache.delete(conversationId)
}
