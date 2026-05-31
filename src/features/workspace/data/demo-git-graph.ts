export type GitGraphNodeKind = "commit" | "merge" | "branch"

export type GitGraphNode = {
  id: string
  lane: number
  message: string
  branch: string
  tag?: string
  kind: GitGraphNodeKind
  author?: string
  checkpointId?: string
  branchId?: string
  conversationId?: string
  forkBranchNames?: string[]
  mergeSourceBranchId?: string
  mergeSourceBranchName?: string
  mergeSourceCheckpointId?: string
  mergeSourceCheckpointTitle?: string
  mergeSourceLane?: number
}

/** Demo graph — replace with API when idea-history lands. */
export const DEMO_GIT_GRAPH_NODES: GitGraphNode[] = [
  {
    id: "c1",
    lane: 0,
    message: "Initial intake — problem & customer framing",
    branch: "main",
    tag: "intake",
    kind: "commit",
  },
  {
    id: "c2",
    lane: 0,
    message: "Pinned ICP: first-time technical founders",
    branch: "main",
    kind: "commit",
  },
  {
    id: "c3",
    lane: 1,
    message: "Explore pricing tangent",
    branch: "explore/pricing",
    kind: "branch",
  },
  {
    id: "c4",
    lane: 1,
    message: "Willingness-to-pay interviews (n=3)",
    branch: "explore/pricing",
    kind: "commit",
  },
  {
    id: "c5",
    lane: 2,
    message: "Customer segment pivot",
    branch: "feat/customer",
    kind: "branch",
  },
  {
    id: "c6",
    lane: 2,
    message: "Narrow wedge to YC applicants",
    branch: "feat/customer",
    tag: "v0.1",
    kind: "commit",
  },
  {
    id: "c7",
    lane: 1,
    message: "Merge explore/pricing into main",
    branch: "main",
    kind: "merge",
    author: "founder",
  },
  {
    id: "c8",
    lane: 0,
    message: "Updated problem severity checklist",
    branch: "main",
    kind: "commit",
  },
  {
    id: "c9",
    lane: 2,
    message: "Merge feat/customer — segment change",
    branch: "main",
    kind: "merge",
    author: "founder",
  },
  {
    id: "c10",
    lane: 0,
    message: "Distribution path: Startup School network",
    branch: "main",
    kind: "commit",
  },
  {
    id: "c11",
    lane: 3,
    message: "GTM spike — content-led outreach",
    branch: "spike/gtm",
    kind: "branch",
  },
  {
    id: "c12",
    lane: 3,
    message: "First validation loop documented",
    branch: "spike/gtm",
    tag: "review",
    kind: "commit",
  },
]

export const GIT_GRAPH_LANE_COLORS = [
  "var(--git-lane-0)",
  "var(--git-lane-1)",
  "var(--git-lane-2)",
  "var(--git-lane-3)",
] as const
