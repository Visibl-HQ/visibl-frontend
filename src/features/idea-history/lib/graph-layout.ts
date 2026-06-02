import type { GitGraphNode } from "@/features/workspace/data/demo-git-graph"
import type {
  Branch,
  Checkpoint,
  ProjectHistoryState,
} from "@/features/idea-history/types"
import {
  getBranchById,
  getCheckpointsForBranch,
  getMainBranch,
} from "@/features/idea-history/lib/history-state"

export type GraphConnectionKind = "spine" | "fork" | "merge"

export type GraphConnection = {
  kind: GraphConnectionKind
  fromRow: number
  fromLane: number
  toRow: number
  toLane: number
}

export type GraphLayout = {
  nodes: GitGraphNode[]
  connections: GraphConnection[]
  laneCount: number
}

function buildBranchLanes(state: ProjectHistoryState): Map<string, number> {
  const laneMap = new Map<string, number>()
  laneMap.set(state.mainBranchId, 0)

  let nextLane = 1

  for (const branch of state.branches) {
    if (branch.id === state.mainBranchId || branch.status === "abandoned") {
      continue
    }

    laneMap.set(branch.id, Math.min(3, nextLane))
    nextLane += 1
  }

  return laneMap
}

function findMergedBranchForCheckpoint(
  state: ProjectHistoryState,
  mergeCheckpoint: Checkpoint
): Branch | undefined {
  const titleMatch = mergeCheckpoint.title.match(/^Merged (.+) into main$/)

  if (titleMatch?.[1]) {
    const byName = state.branches.find(
      (branch) => branch.name === titleMatch[1]
    )

    if (byName) {
      return byName
    }
  }

  const parentId = mergeCheckpoint.parentCheckpointId

  if (!parentId) {
    return undefined
  }

  return state.branches.find(
    (branch) =>
      branch.status === "merged" &&
      branch.headCheckpointId &&
      state.checkpoints.some(
        (checkpoint) =>
          checkpoint.id === branch.headCheckpointId &&
          checkpoint.branchId === branch.id
      )
  )
}

function isMergeCheckpoint(checkpoint: Checkpoint): boolean {
  return checkpoint.note === "merge" || checkpoint.title.startsWith("Merged ")
}

export function buildGraphLayout(state: ProjectHistoryState): GraphLayout {
  const laneMap = buildBranchLanes(state)
  const main = getMainBranch(state)

  const checkpoints = [...state.checkpoints].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const nodes: GitGraphNode[] = []

  for (const checkpoint of checkpoints) {
    const branch = getBranchById(state, checkpoint.branchId)

    if (!branch) {
      continue
    }

    const lane = laneMap.get(branch.id) ?? 0

    if (isMergeCheckpoint(checkpoint) && branch.id === state.mainBranchId) {
      const sourceBranch = findMergedBranchForCheckpoint(state, checkpoint)
      const sourceHead = sourceBranch?.headCheckpointId
        ? state.checkpoints.find(
            (item) => item.id === sourceBranch.headCheckpointId
          )
        : undefined

      nodes.push({
        id: checkpoint.id,
        checkpointId: checkpoint.id,
        lane: 0,
        message: checkpoint.title,
        branch: main.name,
        kind: "merge",
        tag: "merge",
        branchId: main.id,
        conversationId: checkpoint.conversationId,
        ...(sourceBranch?.id ? { mergeSourceBranchId: sourceBranch.id } : {}),
        ...(sourceBranch?.name
          ? { mergeSourceBranchName: sourceBranch.name }
          : {}),
        ...(sourceHead?.id ? { mergeSourceCheckpointId: sourceHead.id } : {}),
        ...(sourceHead?.title
          ? { mergeSourceCheckpointTitle: sourceHead.title }
          : {}),
        ...(sourceBranch && laneMap.get(sourceBranch.id) !== undefined
          ? { mergeSourceLane: laneMap.get(sourceBranch.id)! }
          : {}),
      })
      continue
    }

    nodes.push({
      id: checkpoint.id,
      checkpointId: checkpoint.id,
      lane,
      message: checkpoint.title,
      branch: branch.name,
      ...(checkpoint.note && !isMergeCheckpoint(checkpoint)
        ? { tag: checkpoint.note.slice(0, 12) }
        : {}),
      kind: "commit",
      branchId: branch.id,
      conversationId: checkpoint.conversationId,
    })
  }

  const connections = buildGraphConnections(nodes, state, laneMap)
  const laneValues = Array.from(laneMap.values())
  const laneCount =
    laneValues.length === 0 ? 1 : Math.max(...laneValues, 0) + 1

  return { nodes, connections, laneCount }
}

/** @deprecated Use buildGraphLayout — kept for callers that only need nodes. */
export function checkpointsToGraphNodes(
  state: ProjectHistoryState
): GitGraphNode[] {
  return buildGraphLayout(state).nodes
}

function buildGraphConnections(
  nodes: GitGraphNode[],
  state: ProjectHistoryState,
  laneMap: Map<string, number>
): GraphConnection[] {
  const connections: GraphConnection[] = []
  const rowByCheckpointId = new Map<string, number>()
  const nodeByCheckpointId = new Map<string, GitGraphNode>()

  nodes.forEach((node, row) => {
    if (node.checkpointId) {
      rowByCheckpointId.set(node.checkpointId, row)
      nodeByCheckpointId.set(node.checkpointId, node)
    }
  })

  const spineKeys = new Set<string>()

  function addSpine(fromRow: number, toRow: number, lane: number) {
    if (fromRow === toRow) {
      return
    }

    const key = `${fromRow}-${toRow}-${lane}`

    if (spineKeys.has(key)) {
      return
    }

    spineKeys.add(key)
    connections.push({
      kind: "spine",
      fromRow,
      fromLane: lane,
      toRow,
      toLane: lane,
    })
  }

  // Spine follows parentCheckpointId on the same branch — stays continuous
  // even when other branches sit between rows in the timeline.
  for (const checkpoint of state.checkpoints) {
    if (!checkpoint.parentCheckpointId) {
      continue
    }

    const parent = state.checkpoints.find(
      (item) => item.id === checkpoint.parentCheckpointId
    )

    if (!parent || parent.branchId !== checkpoint.branchId) {
      continue
    }

    const childRow = rowByCheckpointId.get(checkpoint.id)
    const parentRow = rowByCheckpointId.get(parent.id)

    if (childRow === undefined || parentRow === undefined) {
      continue
    }

    const lane = laneMap.get(checkpoint.branchId) ?? 0
    addSpine(childRow, parentRow, lane)
  }

  for (const branch of state.branches) {
    if (branch.id === state.mainBranchId || branch.status === "abandoned") {
      continue
    }

    const branchLane = laneMap.get(branch.id) ?? 1
    const branchOnlyCommits = getCheckpointsForBranch(state, branch.id).filter(
      (checkpoint) => checkpoint.branchId === branch.id
    )

    const firstBranchCommit = branchOnlyCommits[0]
    const forkCheckpointId =
      firstBranchCommit?.parentCheckpointId ?? branch.forkedFromCheckpointId
    const forkRow = rowByCheckpointId.get(forkCheckpointId)
    const forkNode = nodeByCheckpointId.get(forkCheckpointId)

    if (forkRow === undefined || !forkNode) {
      continue
    }

    const fromLane = forkNode.lane

    if (firstBranchCommit) {
      const targetRow = rowByCheckpointId.get(firstBranchCommit.id)

      if (
        targetRow !== undefined &&
        fromLane !== branchLane &&
        forkRow !== targetRow
      ) {
        connections.push({
          kind: "fork",
          fromRow: forkRow,
          fromLane,
          toRow: targetRow,
          toLane: branchLane,
        })
      }
    }
  }

  nodes.forEach((node, mergeRow) => {
    if (node.kind !== "merge") {
      return
    }

    const sourceLane = node.mergeSourceLane

    if (sourceLane === undefined || !node.mergeSourceCheckpointId) {
      return
    }

    const sourceRow = rowByCheckpointId.get(node.mergeSourceCheckpointId)

    if (sourceRow === undefined) {
      return
    }

    connections.push({
      kind: "merge",
      fromRow: sourceRow,
      fromLane: sourceLane,
      toRow: mergeRow,
      toLane: 0,
    })
  })

  return connections
}

export function getAllCheckpointsSorted(
  state: ProjectHistoryState
): Checkpoint[] {
  return [...state.checkpoints].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
