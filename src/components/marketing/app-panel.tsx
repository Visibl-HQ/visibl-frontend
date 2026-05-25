import { cn } from "@/lib/utils"

type AppPanelProps = {
  children: React.ReactNode
  className?: string
}

export function AppPanel({ children, className }: AppPanelProps) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card/80 rounded-lg border p-6 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}
