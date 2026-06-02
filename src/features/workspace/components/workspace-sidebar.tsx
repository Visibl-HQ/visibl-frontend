"use client"

import { useState } from "react"
import {
  GitBranch,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
} from "lucide-react"
import { AppLogoMark } from "@/components/layout/app-logo-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserMenu } from "@/features/projects/components/user-menu"
import {
  ConversationList,
  type ConversationListItem,
} from "@/features/workspace/components/conversation-list"
import { GitGraphView } from "@/features/workspace/components/git-graph-view"
import type { GitGraphNode } from "@/features/workspace/data/demo-git-graph"
import type { GraphNodeInsight } from "@/features/idea-history/lib/checkpoint-graph-meta"
import type { GraphConnection } from "@/features/idea-history/lib/graph-layout"
import { getConversationTitle } from "@/features/workspace/data/conversation-meta"
import { cn } from "@/lib/utils"

export type SidebarView = "chats" | "graph"

type CollapsedSidebarBrandToggleProps = {
  onToggle: () => void
}

/** Collapsed rail: Visibl mark by default; hover/focus swaps to expand icon (ChatGPT-style). */
function CollapsedSidebarBrandToggle({
  onToggle,
}: CollapsedSidebarBrandToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="group relative size-8 shrink-0"
      aria-label="Expand conversations sidebar"
      onClick={onToggle}
    >
      <span className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 group-focus-visible:opacity-0 motion-safe:transition-opacity motion-safe:duration-150">
        <AppLogoMark
          href=""
          showWordmark={false}
          size="sm"
          className="pointer-events-none"
        />
      </span>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-150">
        <PanelLeft
          className="text-muted-foreground size-4"
          aria-hidden="true"
        />
      </span>
    </Button>
  )
}

type WorkspaceSidebarProps = {
  projectName: string
  activeConversationId: string
  conversationItems: ConversationListItem[]
  view: SidebarView
  onViewChange: (view: SidebarView) => void
  onNewConversation: () => void | Promise<void>
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation?: (conversationId: string) => void | Promise<void>
  collapsed?: boolean
  onToggleCollapse?: () => void
  graphNodes?: GitGraphNode[]
  graphConnections?: GraphConnection[]
  graphLaneCount?: number
  activeCheckpointId?: string | null
  onSelectGraphNode?: (node: GitGraphNode) => void
  getGraphNodeInsight?: (node: GitGraphNode) => GraphNodeInsight | null
  isHistoryLoading?: boolean
  historyError?: string | null
  onRetryHistory?: () => void | Promise<void>
  className?: string
}

export function WorkspaceSidebar({
  projectName,
  activeConversationId,
  conversationItems,
  view,
  onViewChange,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  collapsed = false,
  onToggleCollapse,
  graphNodes = [],
  graphConnections = [],
  graphLaneCount = 4,
  activeCheckpointId = null,
  onSelectGraphNode,
  getGraphNodeInsight,
  isHistoryLoading = false,
  historyError = null,
  onRetryHistory,
  className,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = searchQuery.trim()
    ? conversationItems.filter(({ conversation, preview }) => {
        const query = searchQuery.toLowerCase()
        const title = getConversationTitle(conversation, preview).toLowerCase()
        const body = preview?.toLowerCase() ?? ""
        return title.includes(query) || body.includes(query)
      })
    : conversationItems

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center gap-1 py-2",
          className
        )}
      >
        {onToggleCollapse ? (
          <CollapsedSidebarBrandToggle onToggle={onToggleCollapse} />
        ) : (
          <AppLogoMark href="/projects" showWordmark={false} size="sm" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8"
          aria-label="New chat"
          onClick={() => void onNewConversation()}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8"
          aria-label="Conversations"
          onClick={() => {
            onViewChange("chats")
            onToggleCollapse?.()
          }}
        >
          <MessageSquare className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8"
          aria-label="Idea graph"
          onClick={() => {
            onViewChange("graph")
            onToggleCollapse?.()
          }}
        >
          <GitBranch className="size-4" aria-hidden="true" />
        </Button>
        <div className="flex-1" aria-hidden="true" />
        <UserMenu compact />
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 space-y-1 p-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <AppLogoMark href="/projects" showWordmark={false} size="sm" />
          {onToggleCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground size-8 shrink-0"
              aria-label="Collapse conversations sidebar"
              onClick={onToggleCollapse}
            >
              <PanelLeftClose className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        <p className="text-muted-foreground truncate px-2.5 text-xs font-medium">
          {projectName}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start gap-2 px-2.5"
          onClick={() => void onNewConversation()}
        >
          <Plus className="size-4 shrink-0" aria-hidden="true" />
          New chat
        </Button>

        <div className="relative px-0.5">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search chats"
            className="bg-muted/30 h-9 border-transparent pl-9 text-xs shadow-none"
            aria-label="Search conversations (preview)"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {view === "chats" ? "Conversations" : "Idea graph"}
          </p>
          <div
            className="bg-muted/50 flex rounded-md p-0.5"
            role="tablist"
            aria-label="Sidebar view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "chats"}
              className={cn(
                "rounded px-2 py-1 transition-colors",
                view === "chats"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Conversations list"
              onClick={() => onViewChange("chats")}
            >
              <MessageSquare className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "graph"}
              className={cn(
                "rounded px-2 py-1 transition-colors",
                view === "graph"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Git graph view"
              onClick={() => onViewChange("graph")}
            >
              <GitBranch className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {view === "chats" ? (
          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              activeConversationId={activeConversationId}
              items={filteredItems}
              onSelectConversation={onSelectConversation}
              {...(onDeleteConversation ? { onDeleteConversation } : {})}
            />
          </div>
        ) : (
          <GitGraphView
            nodes={graphNodes}
            connections={graphConnections}
            laneCount={graphLaneCount}
            activeCheckpointId={activeCheckpointId}
            onSelectNode={(node) => {
              onSelectGraphNode?.(node)
              onViewChange("chats")
            }}
            {...(getGraphNodeInsight
              ? { getNodeInsight: getGraphNodeInsight }
              : {})}
            isHistoryLoading={isHistoryLoading}
            historyError={historyError}
            {...(onRetryHistory ? { onRetryHistory } : {})}
          />
        )}
      </div>

      <div className="border-border/70 bg-sidebar/95 shrink-0 border-t p-2">
        <UserMenu variant="sidebar" />
      </div>
    </div>
  )
}
