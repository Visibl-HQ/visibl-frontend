import { GitBranch } from "lucide-react"
import { SectionLabel } from "@/components/marketing/section-label"

type GitGraphPlaceholderProps = {
  projectName: string
  userDisplayName: string
}

export function GitGraphPlaceholder({
  projectName,
  userDisplayName,
}: GitGraphPlaceholderProps) {
  return (
    <aside className="border-border/70 bg-card/40 flex h-full flex-col border-r">
      <div className="border-border/70 border-b px-4 py-4">
        <SectionLabel index="00">Project</SectionLabel>
        <h2 className="mt-2 font-serif text-lg font-semibold tracking-tight">
          {projectName}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{userDisplayName}</p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-6">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="text-muted-foreground size-4" aria-hidden="true" />
          <p className="text-sm font-medium">Version history</p>
        </div>
        <div className="border-border/70 bg-muted/30 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm font-medium">Version history coming soon</p>
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            Git graph and decision commits will appear here in a future release.
          </p>
        </div>
      </div>
    </aside>
  )
}
