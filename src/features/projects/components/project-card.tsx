import Link from "next/link"
import { MessageSquareText } from "lucide-react"
import { SectionLabel } from "@/components/marketing/section-label"
import { Badge } from "@/components/ui/badge"
import { formatRelativeDate, formatStageLabel } from "@/lib/format"
import type { ProjectSummaryRead } from "@/lib/api/types"

type ProjectCardProps = {
  project: ProjectSummaryRead
  href: string
}

export function ProjectCard({ project, href }: ProjectCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full min-w-0 focus-visible:outline-none"
    >
      <article className="border-border/70 bg-card/80 hover:border-border focus-within:ring-ring flex h-full min-w-0 flex-col rounded-lg border p-5 transition-colors focus-within:ring-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SectionLabel>Project</SectionLabel>
            <h2 className="group-hover:text-brand mt-1 truncate text-lg font-semibold tracking-tight transition-colors">
              {project.name}
            </h2>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {formatStageLabel(project.current_stage)}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm leading-6">
          {project.current_goal ?? "No goal set yet"}
        </p>
        <div className="text-muted-foreground mt-4 flex min-w-0 items-center justify-between gap-3 border-t pt-4 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MessageSquareText className="size-3.5" aria-hidden="true" />
            <span className="truncate">
              {project.conversation_count} conversation
              {project.conversation_count === 1 ? "" : "s"}
            </span>
          </span>
          <span className="shrink-0">
            Updated {formatRelativeDate(project.updated_at)}
          </span>
        </div>
      </article>
    </Link>
  )
}
