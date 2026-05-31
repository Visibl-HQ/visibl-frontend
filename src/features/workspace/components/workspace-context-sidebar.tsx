"use client"

import { FileText, PanelRight, PanelRightClose, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemoryPinsPanel } from "@/features/workspace/components/memory-pins-panel"
import { ProblemCustomerDocCard } from "@/features/workspace/components/problem-customer-doc-card"
import type { MemoryPinRead, ProblemCustomerDocRead } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type WorkspaceContextSidebarProps = {
  pins: MemoryPinRead[]
  doc: ProblemCustomerDocRead
  collapsed: boolean
  onExpand: () => void
}

type ContextSidebarShellProps = {
  collapsed: boolean
  onToggleCollapse?: () => void
  children: React.ReactNode
}

export function ContextSidebarShell({
  collapsed,
  onToggleCollapse,
  children,
}: ContextSidebarShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "border-border/70 flex shrink-0 items-center border-b py-1.5",
          collapsed ? "justify-center px-1" : "justify-between gap-2 px-3"
        )}
      >
        {!collapsed ? (
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Context
          </p>
        ) : null}
        {onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground size-8"
            aria-label={
              collapsed ? "Expand context sidebar" : "Collapse context sidebar"
            }
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelRight className="size-4" aria-hidden="true" />
            ) : (
              <PanelRightClose className="size-4" aria-hidden="true" />
            )}
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export function WorkspaceContextSidebarCollapsed({
  pinCount,
  docCompletion,
  onExpand,
}: {
  pinCount: number
  docCompletion: number
  onExpand: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground size-8"
        aria-label={`Memory pins, ${pinCount} pinned`}
        title="Memory pins"
        onClick={onExpand}
      >
        <Pin className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground size-8"
        aria-label={`Problem and customer doc, ${docCompletion}% complete`}
        title="Problem & customer"
        onClick={onExpand}
      >
        <FileText className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function WorkspaceContextSidebarContent({
  pins,
  doc,
}: {
  pins: MemoryPinRead[]
  doc: ProblemCustomerDocRead
}) {
  return (
    <div
      data-lenis-prevent
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3"
    >
      <MemoryPinsPanel pins={pins} />
      <ProblemCustomerDocCard doc={doc} />
    </div>
  )
}

export function WorkspaceContextSidebar({
  pins,
  doc,
  collapsed,
  onExpand,
}: WorkspaceContextSidebarProps) {
  if (collapsed) {
    return (
      <WorkspaceContextSidebarCollapsed
        pinCount={pins.length}
        docCompletion={Math.round(doc.completion_percentage)}
        onExpand={onExpand}
      />
    )
  }

  return <WorkspaceContextSidebarContent pins={pins} doc={doc} />
}
