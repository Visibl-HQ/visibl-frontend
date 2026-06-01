import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ArtifactReadiness, FieldSupportLabel } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const supportStyles: Record<FieldSupportLabel, string> = {
  Missing:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-200",
  Weak: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200",
  Supported:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200",
  "Share-safe":
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200",
  Contradicted:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-950 dark:bg-fuchsia-950/30 dark:text-fuchsia-200",
}

const readinessStyles: Record<ArtifactReadiness, string> = {
  Collecting:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200",
  Draftable:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200",
  "Ready for doc":
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200",
  "Ready for PPT":
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-950 dark:bg-violet-950/30 dark:text-violet-200",
  "Ready to share":
    "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-950 dark:bg-teal-950/30 dark:text-teal-200",
}

export function SupportBadge({
  label,
  className,
}: {
  label: FieldSupportLabel
  className?: string
}) {
  const Icon =
    label === "Missing"
      ? CircleDashed
      : label === "Contradicted"
        ? AlertTriangle
        : label === "Share-safe"
          ? ShieldCheck
          : CheckCircle2

  return (
    <Badge variant="outline" className={cn(supportStyles[label], className)}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}

export function ReadinessBadge({
  readiness,
  className,
}: {
  readiness: ArtifactReadiness
  className?: string
}) {
  const Icon =
    readiness === "Collecting"
      ? CircleDashed
      : readiness === "Draftable"
        ? Clock3
        : FileText

  return (
    <Badge
      variant="outline"
      className={cn(readinessStyles[readiness], className)}
    >
      <Icon className="size-3" aria-hidden="true" />
      {readiness}
    </Badge>
  )
}
