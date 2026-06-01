import type {
  Branch,
  Checkpoint,
  ConversationBinding,
  ProjectHistoryState,
} from "@/features/idea-history/types"
import { MAIN_BRANCH_NAME } from "@/features/idea-history/types"

export function createInitialHistoryState(): ProjectHistoryState {
  const mainBranchId = crypto.randomUUID()
  const mainBranch: Branch = {
    id: mainBranchId,
    name: MAIN_BRANCH_NAME,
    createdAt: new Date().toISOString(),
    forkedFromCheckpointId: "",
    parentBranchId: mainBranchId,
    headCheckpointId: null,
    status: "active",
  }

  return {
    version: 1,
    mainBranchId,
    branches: [mainBranch],
    checkpoints: [],
    conversationBindings: {},
    oneOffSessions: [],
  }
}

export function getMainBranch(state: ProjectHistoryState): Branch {
  const main =
    state.branches.find((branch) => branch.id === state.mainBranchId) ??
    state.branches[0]

  if (!main) {
    throw new Error("Project history is missing a main branch.")
  }

  return main
}

export function getBranchById(
  state: ProjectHistoryState,
  branchId: string
): Branch | undefined {
  return state.branches.find((branch) => branch.id === branchId)
}

export function getBinding(
  state: ProjectHistoryState,
  conversationId: string
): ConversationBinding | undefined {
  return state.conversationBindings[conversationId]
}

export function resolveConversationBinding(
  state: ProjectHistoryState,
  conversationId: string
): ConversationBinding {
  const existing = state.conversationBindings[conversationId]

  if (existing) {
    return existing
  }

  const main = getMainBranch(state)

  return {
    conversationId,
    branchId: main.id,
    baseCheckpointId: main.headCheckpointId,
    lastCheckpointId: main.headCheckpointId,
  }
}

export function ensureConversationBinding(
  state: ProjectHistoryState,
  conversationId: string
): ProjectHistoryState {
  if (state.conversationBindings[conversationId]) {
    return state
  }

  const main = getMainBranch(state)

  return {
    ...state,
    conversationBindings: {
      ...state.conversationBindings,
      [conversationId]: {
        conversationId,
        branchId: main.id,
        baseCheckpointId: main.headCheckpointId,
        lastCheckpointId: main.headCheckpointId,
      },
    },
  }
}

export function getCheckpointsForBranch(
  state: ProjectHistoryState,
  branchId: string
): Checkpoint[] {
  return state.checkpoints
    .filter((checkpoint) => checkpoint.branchId === branchId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

export function getHeadCheckpoint(
  state: ProjectHistoryState,
  branchId: string
): Checkpoint | undefined {
  const branch = getBranchById(state, branchId)

  if (!branch?.headCheckpointId) {
    return undefined
  }

  return state.checkpoints.find(
    (checkpoint) => checkpoint.id === branch.headCheckpointId
  )
}

export function resolveDirtyBaseline(
  state: ProjectHistoryState,
  binding: ConversationBinding
): Checkpoint | null {
  if (!binding.baseCheckpointId) {
    return null
  }

  return (
    state.checkpoints.find(
      (checkpoint) => checkpoint.id === binding.baseCheckpointId
    ) ?? null
  )
}

export function resolveBranchViewCheckpoint(
  state: ProjectHistoryState,
  branchId: string,
  binding: ConversationBinding
): Checkpoint | null {
  const branch = getBranchById(state, branchId)

  if (!branch) {
    return null
  }

  if (branch.headCheckpointId) {
    const ownedHead = state.checkpoints.find(
      (checkpoint) =>
        checkpoint.id === branch.headCheckpointId &&
        checkpoint.branchId === branchId
    )

    if (ownedHead) {
      return ownedHead
    }
  }

  const forkBaselineIds = [
    branch.forkedFromCheckpointId,
    binding.baseCheckpointId,
  ]

  for (const checkpointId of forkBaselineIds) {
    if (!checkpointId) {
      continue
    }

    const checkpoint = state.checkpoints.find(
      (item) => item.id === checkpointId
    )

    if (checkpoint) {
      return checkpoint
    }
  }

  return null
}

export function branchHasOwnedCheckpoints(
  state: ProjectHistoryState,
  branchId: string
): boolean {
  return state.checkpoints.some(
    (checkpoint) => checkpoint.branchId === branchId
  )
}

export function slugifyBranchName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function uniqueBranchName(
  state: ProjectHistoryState,
  desired: string
): string {
  const base = slugifyBranchName(desired) || "explore"
  const existing = new Set(
    state.branches.map((branch) => branch.name.toLowerCase())
  )

  if (!existing.has(base)) {
    return base
  }

  let index = 2

  while (existing.has(`${base}-${index}`)) {
    index += 1
  }

  return `${base}-${index}`
}

export function getActiveBranches(state: ProjectHistoryState): Branch[] {
  return state.branches.filter((branch) => branch.status === "active")
}

export function switchConversationBranch(
  state: ProjectHistoryState,
  conversationId: string,
  branchId: string,
  checkpointId?: string | null
): ProjectHistoryState {
  const branch = getBranchById(state, branchId)

  if (!branch) {
    return state
  }

  const withBinding = ensureConversationBinding(state, conversationId)
  const binding = withBinding.conversationBindings[conversationId]

  if (!binding) {
    return state
  }

  const resolvedCheckpointId =
    checkpointId !== undefined ? checkpointId : branch.headCheckpointId

  return {
    ...withBinding,
    conversationBindings: {
      ...withBinding.conversationBindings,
      [conversationId]: {
        conversationId,
        branchId,
        baseCheckpointId: resolvedCheckpointId,
        lastCheckpointId: resolvedCheckpointId,
      },
    },
  }
}
