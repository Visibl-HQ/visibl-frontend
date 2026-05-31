import { cn } from "@/lib/utils"

type AppShellProps = {
  children: React.ReactNode
  className?: string
  fixedHeight?: boolean
}

export function AppShell({
  children,
  className,
  fixedHeight = false,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "app-frame-bg text-foreground flex flex-col",
        fixedHeight ? "h-dvh overflow-hidden" : "min-h-dvh",
        className
      )}
    >
      {children}
    </div>
  )
}
