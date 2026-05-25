import { cn } from "@/lib/utils"

type AssistantMarkProps = {
  className?: string
}

export function AssistantMark({ className }: AssistantMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="7"
        className="stroke-border"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="5.5"
        className="stroke-brand"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="1.75" className="fill-brand" />
      <path
        d="M16 7.5v3M16 21.5v3M7.5 16h3M21.5 16h3"
        className="stroke-muted-foreground/50"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}
