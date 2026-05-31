import type { MemoryPinRead, ProblemCustomerDocRead } from "@/lib/api/types"

export type BranchStatus = "active" | "merged" | "abandoned"

export type Branch = {
  id: string
  name: string
  createdAt: string
  forkedFromCheckpointId: string
  parentBranchId: string
  headCheckpointId: string | null
  status: BranchStatus
}

export type Checkpoint = {
  id: string
  branchId: string
  conversationId: string
  title: string
  note?: string
  createdAt: string
  pinsSnapshot: MemoryPinRead[]
  docSnapshot: ProblemCustomerDocRead
  messageCount: number
  parentCheckpointId: string | null
}

export type ConversationBinding = {
  conversationId: string
  branchId: string
  baseCheckpointId: string | null
  lastCheckpointId: string | null
}

export type ProjectHistoryState = {
  version: 1
  mainBranchId: string
  branches: Branch[]
  checkpoints: Checkpoint[]
  conversationBindings: Record<string, ConversationBinding>
  oneOffSessions: OneOffSession[]
}

export type DirtyChangeKind = "pin" | "doc" | "message"

export type DirtyChange = {
  kind: DirtyChangeKind
  label: string
  detail?: string
}

export type PotentialImpact = {
  field: string
  description: string
  severity: "medium" | "high"
}

export type OneOffMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export type OneOffSession = {
  id: string
  question: string
  messages: OneOffMessage[]
  potentialImpacts: PotentialImpact[]
  forkCheckpointId: string | null
  createdAt: string
}

export const MAIN_BRANCH_NAME = "main"
