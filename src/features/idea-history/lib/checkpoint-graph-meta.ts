import type { GitGraphNode } from "@/features/workspace/data/demo-git-graph"
import type { ProjectHistoryState } from "@/features/idea-history/types"
import { getBranchById } from "@/features/idea-history/lib/history-state"

export type CheckpointHoverMeta = {
  title: string
  branchName: string
  pinCount: number
  docCompletion: number
  oneOffCount: number
  childBranchNames: string[]
  createdAt: string
}

export type GraphNodeInsight =
  | {
      kind: "checkpoint"
      title: string
      branchName: string
      pinCount: number
      docCompletion: number
      oneOffCount: number
      childBranchNames: string[]
      createdAt: string
    }
  | {
      kind: "merge"
      title: string
      sourceBranchName: string
      sourceCheckpointTitle: string
      pinCount: number
      docCompletion: number
      createdAt: string
    }

export function countOneOffsFromCheckpoint(
  state: ProjectHistoryState,
  checkpointId: string
): number {
  return state.oneOffSessions.filter(
    (session) => session.forkCheckpointId === checkpointId
  ).length
}

export function getBranchesForkedFromCheckpoint(
  state: ProjectHistoryState,
  checkpointId: string
): string[] {
  return state.branches
    .filter((branch) => branch.forkedFromCheckpointId === checkpointId)
    .map((branch) => branch.name)
}

export function getCheckpointHoverMeta(
  state: ProjectHistoryState,
  checkpointId: string
): CheckpointHoverMeta | null {
  const checkpoint = state.checkpoints.find((item) => item.id === checkpointId)

  if (!checkpoint) {
    return null
  }

  const branch = getBranchById(state, checkpoint.branchId)

  return {
    title: checkpoint.title,
    branchName: branch?.name ?? "unknown",
    pinCount: checkpoint.pinsSnapshot.length,
    docCompletion: Math.round(checkpoint.docSnapshot.completion_percentage),
    oneOffCount: countOneOffsFromCheckpoint(state, checkpointId),
    childBranchNames: getBranchesForkedFromCheckpoint(state, checkpointId),
    createdAt: checkpoint.createdAt,
  }
}

export function getGraphNodeInsight(
  state: ProjectHistoryState,
  node: GitGraphNode
): GraphNodeInsight | null {
  if (node.kind === "merge" && node.checkpointId) {
    const checkpoint = state.checkpoints.find(
      (item) => item.id === node.checkpointId
    )

    if (!checkpoint) {
      return null
    }

    return {
      kind: "merge",
      title: checkpoint.title,
      sourceBranchName: node.mergeSourceBranchName ?? "branch",
      sourceCheckpointTitle:
        node.mergeSourceCheckpointTitle ?? "Latest branch checkpoint",
      pinCount: checkpoint.pinsSnapshot.length,
      docCompletion: Math.round(checkpoint.docSnapshot.completion_percentage),
      createdAt: checkpoint.createdAt,
    }
  }

  if (node.checkpointId) {
    const meta = getCheckpointHoverMeta(state, node.checkpointId)

    if (!meta) {
      return null
    }

    return {
      kind: "checkpoint",
      ...meta,
    }
  }

  return null
}
