import { cn } from "@/lib/utils"

type SectionLabelProps = {
  index?: string
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ index, children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase",
        className,
      )}
    >
      {index ? `${index} · ` : null}
      {children}
    </p>
  )
}
