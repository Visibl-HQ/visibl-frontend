import type { ConversationGitMeta } from "@/features/workspace/data/conversation-meta"
import {
  getBinding,
  getBranchById,
  getMainBranch,
} from "@/features/idea-history/lib/history-state"
import type { ProjectHistoryState } from "@/features/idea-history/types"

export function getConversationGitMetaFromHistory(
  state: ProjectHistoryState,
  conversationId: string
): ConversationGitMeta {
  const binding = getBinding(state, conversationId)
  const main = getMainBranch(state)

  if (!binding) {
    return { branch: main.name, tag: null }
  }

  const branch = getBranchById(state, binding.branchId)
  const checkpoint = binding.lastCheckpointId
    ? state.checkpoints.find((item) => item.id === binding.lastCheckpointId)
    : undefined

  return {
    branch: branch?.name ?? main.name,
    tag: checkpoint?.title ? checkpoint.title.slice(0, 16) : null,
  }
}
