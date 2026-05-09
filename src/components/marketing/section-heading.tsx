import { typography } from "@/config/tokens"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "mx-0 text-left",
        className
      )}
    >
      {eyebrow ? <p className={typography.eyebrow}>{eyebrow}</p> : null}
      <h2 className={cn(typography.h2, eyebrow && "mt-3")}>{title}</h2>
      {description ? (
        <p className={cn(typography.lead, "mt-4")}>{description}</p>
      ) : null}
    </div>
  )
}
