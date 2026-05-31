import { cn } from "@/lib/utils"

type CollapsibleSidebarProps = {
  side: "left" | "right"
  collapsed: boolean
  children: React.ReactNode
  className?: string
}

/** Width + border shell for workspace side rails. Toggle lives in sidebar headers. */
export function CollapsibleSidebar({
  side,
  collapsed,
  children,
  className,
}: CollapsibleSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        side === "left"
          ? "border-border/70 bg-sidebar/80 border-r"
          : "border-border/70 bg-surface border-l",
        collapsed ? "w-12" : "w-full",
        className
      )}
      data-collapsed={collapsed}
    >
      {children}
    </aside>
  )
}
