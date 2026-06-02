import type {
  BindingRestoreRead,
  BindingUpdateResponse,
  BranchRead,
  CheckpointRead,
  ConversationBindingRead,
  CreateBranchResponse,
  IdeaHistoryBootstrapRead,
  MergeBranchResponse,
  OneOffMessageRead,
  OneOffSessionRead,
  PotentialImpactRead,
} from "@/lib/api/types"
import { normalizeMemoryPins } from "@/lib/api/normalize-memory-pin"
import type {
  Branch,
  Checkpoint,
  ConversationBinding,
  OneOffMessage,
  OneOffSession,
  PotentialImpact,
  ProjectHistoryState,
} from "@/features/idea-history/types"

export function adaptBranch(read: BranchRead): Branch {
  return {
    id: read.public_id,
    name: read.name,
    createdAt: read.created_at,
    forkedFromCheckpointId: read.forked_from_checkpoint_public_id ?? "",
    parentBranchId: read.parent_branch_public_id,
    headCheckpointId: read.head_checkpoint_public_id,
    status: read.status,
  }
}

export function adaptCheckpoint(read: CheckpointRead): Checkpoint {
  return {
    id: read.public_id,
    branchId: read.branch_public_id,
    conversationId: read.conversation_public_id,
    title: read.title,
    ...(read.note ? { note: read.note } : {}),
    createdAt: read.created_at,
    pinsSnapshot: normalizeMemoryPins(read.pins_snapshot),
    docSnapshot: {
      ...read.doc_snapshot,
      checklist: { ...read.doc_snapshot.checklist },
    },
    messageCount: read.message_count,
    parentCheckpointId: read.parent_checkpoint_public_id,
  }
}

export function adaptBinding(
  read: ConversationBindingRead
): ConversationBinding {
  return {
    conversationId: read.conversation_public_id,
    branchId: read.branch_public_id,
    baseCheckpointId: read.base_checkpoint_public_id,
    lastCheckpointId: read.last_checkpoint_public_id,
  }
}

export function adaptPotentialImpact(
  read: PotentialImpactRead
): PotentialImpact {
  return {
    field: read.field,
    description: read.description,
    severity: read.severity,
  }
}

export function adaptOneOffMessage(read: OneOffMessageRead): OneOffMessage {
  return {
    id: read.id,
    role: read.role,
    content: read.content,
    createdAt: read.created_at,
  }
}

export function adaptOneOffSession(read: OneOffSessionRead): OneOffSession {
  return {
    id: read.public_id,
    question: read.question,
    messages: read.messages.map(adaptOneOffMessage),
    potentialImpacts: read.potential_impacts.map(adaptPotentialImpact),
    forkCheckpointId: read.fork_checkpoint_public_id,
    createdAt: read.created_at,
  }
}

export function adaptBootstrap(
  read: IdeaHistoryBootstrapRead
): ProjectHistoryState {
  const conversationBindings: Record<string, ConversationBinding> = {}

  for (const binding of read.conversation_bindings) {
    const adapted = adaptBinding(binding)
    conversationBindings[adapted.conversationId] = adapted
  }

  return {
    version: read.version,
    mainBranchId: read.main_branch_public_id,
    branches: read.branches.map(adaptBranch),
    checkpoints: read.checkpoints.map(adaptCheckpoint),
    conversationBindings,
    oneOffSessions: read.one_off_sessions.map(adaptOneOffSession),
  }
}

export function checkpointForRestore(
  checkpoint: CheckpointRead | null,
  restore: BindingRestoreRead
): Checkpoint | null {
  if (!checkpoint) {
    return null
  }

  return checkpointWithLiveRestore(adaptCheckpoint(checkpoint), restore)
}

export function checkpointWithLiveRestore(
  template: Checkpoint,
  restore: BindingRestoreRead
): Checkpoint {
  return {
    ...template,
    pinsSnapshot: normalizeMemoryPins(restore.memory_pins),
    docSnapshot: {
      ...restore.problem_customer_doc,
      checklist: { ...restore.problem_customer_doc.checklist },
    },
  }
}

export function upsertBranch(
  state: ProjectHistoryState,
  branch: Branch
): ProjectHistoryState {
  const existingIndex = state.branches.findIndex(
    (item) => item.id === branch.id
  )

  if (existingIndex === -1) {
    return {
      ...state,
      branches: [...state.branches, branch],
    }
  }

  const branches = [...state.branches]
  branches[existingIndex] = branch

  return { ...state, branches }
}

export function upsertCheckpoint(
  state: ProjectHistoryState,
  checkpoint: Checkpoint
): ProjectHistoryState {
  const existingIndex = state.checkpoints.findIndex(
    (item) => item.id === checkpoint.id
  )

  if (existingIndex === -1) {
    return {
      ...state,
      checkpoints: [...state.checkpoints, checkpoint],
    }
  }

  const checkpoints = [...state.checkpoints]
  checkpoints[existingIndex] = checkpoint

  return { ...state, checkpoints }
}

export function setConversationBinding(
  state: ProjectHistoryState,
  binding: ConversationBinding
): ProjectHistoryState {
  return {
    ...state,
    conversationBindings: {
      ...state.conversationBindings,
      [binding.conversationId]: binding,
    },
  }
}

export function applyCheckpointCreated(
  state: ProjectHistoryState,
  checkpointRead: CheckpointRead
): ProjectHistoryState {
  const checkpoint = adaptCheckpoint(checkpointRead)
  let nextState = upsertCheckpoint(state, checkpoint)

  const branch = nextState.branches.find(
    (item) => item.id === checkpoint.branchId
  )

  if (branch) {
    nextState = upsertBranch(nextState, {
      ...branch,
      headCheckpointId: checkpoint.id,
    })
  }

  const binding = adaptBinding({
    conversation_public_id: checkpointRead.conversation_public_id,
    branch_public_id: checkpointRead.branch_public_id,
    base_checkpoint_public_id: checkpoint.id,
    last_checkpoint_public_id: checkpoint.id,
  })

  return setConversationBinding(nextState, binding)
}

export function applyCreateBranchResponse(
  state: ProjectHistoryState,
  response: CreateBranchResponse
): ProjectHistoryState {
  const nextState = upsertBranch(state, adaptBranch(response.branch))

  return setConversationBinding(nextState, adaptBinding(response.binding))
}

export function applyBindingUpdate(
  state: ProjectHistoryState,
  response: BindingUpdateResponse
): ProjectHistoryState {
  let nextState = setConversationBinding(state, adaptBinding(response.binding))

  if (response.checkpoint) {
    const adapted = adaptCheckpoint(response.checkpoint)
    const existing = state.checkpoints.find((item) => item.id === adapted.id)

    if (!existing) {
      nextState = upsertCheckpoint(nextState, adapted)
    }
  }

  return nextState
}

export function applyMergeBranchResponse(
  state: ProjectHistoryState,
  response: MergeBranchResponse
): ProjectHistoryState {
  let nextState = upsertCheckpoint(
    state,
    adaptCheckpoint(response.merge_checkpoint)
  )
  nextState = upsertBranch(nextState, adaptBranch(response.main_branch))
  nextState = upsertBranch(nextState, adaptBranch(response.merged_branch))
  return setConversationBinding(nextState, adaptBinding(response.binding))
}

export function upsertOneOffSession(
  state: ProjectHistoryState,
  session: OneOffSession
): ProjectHistoryState {
  const existingIndex = state.oneOffSessions.findIndex(
    (item) => item.id === session.id
  )

  if (existingIndex === -1) {
    return {
      ...state,
      oneOffSessions: [...state.oneOffSessions, session],
    }
  }

  const oneOffSessions = [...state.oneOffSessions]
  oneOffSessions[existingIndex] = session

  return { ...state, oneOffSessions }
}
