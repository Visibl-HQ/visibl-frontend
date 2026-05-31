import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border/70 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center",
        className
      )}
    >
      <span className="border-border/70 bg-background grid size-11 place-items-center rounded-md border">
        <Icon className="text-muted-foreground size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-serif text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-7">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
