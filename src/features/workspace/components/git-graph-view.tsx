"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AlertCircle, GitBranch, GitMerge, Loader2, MapPin, RefreshCw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  GIT_GRAPH_LANE_COLORS,
  type GitGraphNode,
} from "@/features/workspace/data/demo-git-graph"
import type { GraphNodeInsight } from "@/features/idea-history/lib/checkpoint-graph-meta"
import type { GraphConnection } from "@/features/idea-history/lib/graph-layout"
import { cn } from "@/lib/utils"

const ROW_HEIGHT = 32
const LANE_WIDTH = 14
const GRAPH_PADDING = 12
const NODE_RADIUS = 4
const MERGE_NODE_RADIUS = 4.5
const PATH_RADIUS = 4

type GitGraphViewProps = {
  nodes?: GitGraphNode[]
  connections?: GraphConnection[]
  laneCount?: number
  activeCheckpointId?: string | null
  onSelectNode?: (node: GitGraphNode) => void
  getNodeInsight?: (node: GitGraphNode) => GraphNodeInsight | null
  isHistoryLoading?: boolean
  historyError?: string | null
  onRetryHistory?: () => void | Promise<void>
  className?: string
}

function laneCenterX(lane: number): number {
  return GRAPH_PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2
}

function rowCenterY(row: number): number {
  return row * ROW_HEIGHT + ROW_HEIGHT / 2
}

function branchPath(x1: number, y1: number, x2: number, y2: number): string {
  if (Math.abs(x1 - x2) < 0.5) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }

  const radius = Math.min(
    PATH_RADIUS,
    Math.abs(x2 - x1) / 2,
    Math.abs(y2 - y1) / 2
  )
  const cornerY = y2 + (y2 < y1 ? radius : -radius)
  const cornerX = x1 + (x2 > x1 ? radius : -radius)

  return `M ${x1} ${y1} L ${x1} ${cornerY} Q ${x1} ${y2} ${cornerX} ${y2} L ${x2} ${y2}`
}

function connectionPath(connection: GraphConnection): string {
  const x1 = laneCenterX(connection.fromLane)
  const y1 = rowCenterY(connection.fromRow)
  const x2 = laneCenterX(connection.toLane)
  const y2 = rowCenterY(connection.toRow)

  if (connection.kind === "spine") {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }

  return branchPath(x1, y1, x2, y2)
}

function GraphNodeMarker({
  node,
  row,
  color,
  isActive,
  isHovered,
}: {
  node: GitGraphNode
  row: number
  color: string
  isActive: boolean
  isHovered: boolean
}) {
  const cx = laneCenterX(node.lane)
  const cy = rowCenterY(row)
  const scale = isActive || isHovered ? 1.12 : 1

  if (node.kind === "merge") {
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
        <circle
          r={MERGE_NODE_RADIUS}
          fill="var(--background)"
          stroke={color}
          strokeWidth={1.75}
        />
        <circle r={1.75} fill={color} />
      </g>
    )
  }

  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <circle
        r={NODE_RADIUS + 1.5}
        fill="var(--background)"
        stroke={isActive ? "var(--primary)" : "var(--background)"}
        strokeWidth={isActive ? 1.75 : 2}
      />
      <circle r={NODE_RADIUS} fill={color} />
    </g>
  )
}

function GraphNodeInsightPanel({
  insight,
  anchorRect,
}: {
  insight: GraphNodeInsight
  anchorRect: DOMRect
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    const panel = panelRef.current

    if (!panel) {
      return
    }

    const panelHeight = panel.offsetHeight
    const panelWidth = panel.offsetWidth
    const gap = 6
    const viewportPadding = 8

    let top = anchorRect.bottom + gap

    if (top + panelHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, anchorRect.top - panelHeight - gap)
    }

    let left = anchorRect.left

    if (left + panelWidth > window.innerWidth - viewportPadding) {
      left = Math.max(
        viewportPadding,
        window.innerWidth - panelWidth - viewportPadding
      )
    }

    setPosition({ top, left })
  }, [anchorRect, insight])

  const panelClassName =
    "border-border/70 bg-card pointer-events-none fixed z-[9999] min-w-[13.5rem] rounded-lg border p-3 shadow-lg"

  if (insight.kind === "merge") {
    return (
      <div
        ref={panelRef}
        className={panelClassName}
        style={{ top: position.top, left: position.left }}
        role="tooltip"
      >
        <div className="flex items-start gap-2">
          <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
            <GitMerge className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-4 font-medium">{insight.title}</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-4">
              Folded{" "}
              <span className="text-foreground font-mono">
                {insight.sourceBranchName}
              </span>{" "}
              into main from{" "}
              <span className="text-foreground">
                {insight.sourceCheckpointTitle}
              </span>
              .
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <InsightStat
            label="Pins brought in"
            value={String(insight.pinCount)}
          />
          <InsightStat
            label="Doc at merge"
            value={`${insight.docCompletion}%`}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className={panelClassName}
      style={{ top: position.top, left: position.left }}
      role="tooltip"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{insight.title}</p>
          <Badge variant="outline" className="mt-1 font-mono text-[10px]">
            {insight.branchName}
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px]">
            <span>Doc completion</span>
            <span>{insight.docCompletion}%</span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${insight.docCompletion}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InsightStat
            label="Pins"
            value={String(insight.pinCount)}
            icon={MapPin}
          />
          <InsightStat
            label="Tangents"
            value={String(insight.oneOffCount)}
            icon={Sparkles}
          />
        </div>

        {insight.childBranchNames.length > 0 ? (
          <div className="border-border/60 border-t pt-2">
            <p className="text-muted-foreground mb-1.5 flex items-center gap-1 text-[10px]">
              <GitBranch className="size-3" aria-hidden="true" />
              Branched from here
            </p>
            <div className="flex flex-wrap gap-1">
              {insight.childBranchNames.map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function InsightStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof MapPin
}) {
  return (
    <div className="bg-muted/40 rounded-md px-2 py-1.5">
      <p className="text-muted-foreground flex items-center gap-1 text-[10px] whitespace-nowrap">
        {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

export function GitGraphView({
  nodes = [],
  connections = [],
  laneCount = 4,
  activeCheckpointId,
  onSelectNode,
  getNodeInsight,
  isHistoryLoading = false,
  historyError = null,
  onRetryHistory,
  className,
}: GitGraphViewProps) {
  const [hoverState, setHoverState] = useState<{
    nodeId: string
    insight: GraphNodeInsight
    anchorRect: DOMRect
  } | null>(null)
  const graphHeight = Math.max(nodes.length, 1) * ROW_HEIGHT
  const graphWidth = GRAPH_PADDING * 2 + LANE_WIDTH * laneCount

  const connectionStyles = useMemo(() => {
    return connections.map((connection) => ({
      connection,
      path: connectionPath(connection),
      color:
        GIT_GRAPH_LANE_COLORS[connection.fromLane] ?? GIT_GRAPH_LANE_COLORS[0],
    }))
  }, [connections])

  const hoveredNodeId = hoverState?.nodeId ?? null

  const isInteractive = Boolean(onSelectNode)

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {isHistoryLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Loading idea history…
        </div>
      ) : historyError ? (
        <div className="mx-3 my-3 grid gap-2">
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              {historyError === "Internal server error"
                ? "Could not load idea history. A checkpoint snapshot may be incompatible — retry after the backend restarts."
                : historyError}
            </p>
          </div>
          {onRetryHistory ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 justify-self-start text-xs"
              onClick={() => void onRetryHistory()}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : nodes.length === 0 ? (
        <p className="text-muted-foreground px-3 py-4 text-xs leading-5">
          No checkpoints yet. Use the checkpoint button above chat to snapshot
          your story — branches and merges appear here.
        </p>
      ) : (
        <>
          <p className="sr-only">
            Idea history graph — newest checkpoint at top. Click a row to jump;
            hover for snapshot details.
          </p>

          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="relative pb-2">
              <svg
                aria-hidden="true"
                width={graphWidth}
                height={graphHeight}
                className="pointer-events-none absolute top-0 left-0 overflow-visible"
              >
                {connectionStyles.map(({ connection, path, color }, index) => (
                  <path
                    key={`${connection.kind}-${connection.fromRow}-${connection.toRow}-${index}`}
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={0.92}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {nodes.map((node, row) => {
                  const color =
                    GIT_GRAPH_LANE_COLORS[node.lane] ?? GIT_GRAPH_LANE_COLORS[0]
                  const isActive =
                    node.checkpointId !== undefined &&
                    node.checkpointId === activeCheckpointId

                  return (
                    <GraphNodeMarker
                      key={`node-${node.id}`}
                      node={node}
                      row={row}
                      color={color}
                      isActive={isActive}
                      isHovered={hoveredNodeId === node.id}
                    />
                  )
                })}
              </svg>

              <ul className="relative min-w-0">
                {nodes.map((node) => {
                  const isActive =
                    node.checkpointId !== undefined &&
                    node.checkpointId === activeCheckpointId
                  const canClick =
                    isInteractive &&
                    Boolean(node.checkpointId) &&
                    (node.kind === "commit" ||
                      node.kind === "merge" ||
                      node.kind === "branch")

                  return (
                    <li
                      key={node.id}
                      className={cn(
                        "relative flex items-start gap-0 pr-2 transition-colors",
                        canClick && "hover:bg-muted/35 cursor-pointer",
                        isActive && "bg-muted/45"
                      )}
                      style={{ minHeight: ROW_HEIGHT }}
                      onMouseEnter={(event) => {
                        const anchor = event.currentTarget.querySelector(
                          "[data-graph-insight-anchor]"
                        )

                        if (
                          !(anchor instanceof HTMLElement) ||
                          !getNodeInsight
                        ) {
                          return
                        }

                        const insight = getNodeInsight(node)

                        if (!insight) {
                          return
                        }

                        setHoverState({
                          nodeId: node.id,
                          insight,
                          anchorRect: anchor.getBoundingClientRect(),
                        })
                      }}
                      onMouseLeave={() => {
                        setHoverState((current) =>
                          current?.nodeId === node.id ? null : current
                        )
                      }}
                      onClick={() => {
                        if (canClick) {
                          onSelectNode?.(node)
                        }
                      }}
                      onKeyDown={(event) => {
                        if (!canClick) {
                          return
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onSelectNode?.(node)
                        }
                      }}
                      role={canClick ? "button" : undefined}
                      tabIndex={canClick ? 0 : undefined}
                    >
                      <div
                        className="shrink-0"
                        style={{ width: graphWidth, height: ROW_HEIGHT }}
                        aria-hidden="true"
                      />

                      <div
                        data-graph-insight-anchor
                        className="relative flex min-w-0 flex-1 items-center py-1 pr-2 pl-0.5"
                      >
                        <p
                          className={cn(
                            "min-w-0 truncate text-[13px] leading-5",
                            node.kind === "merge"
                              ? "text-muted-foreground"
                              : "text-foreground/90",
                            isActive && "text-foreground font-medium"
                          )}
                        >
                          {node.message}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {hoverState && typeof document !== "undefined"
            ? createPortal(
                <GraphNodeInsightPanel
                  insight={hoverState.insight}
                  anchorRect={hoverState.anchorRect}
                />,
                document.body
              )
            : null}
        </>
      )}
    </div>
  )
}
