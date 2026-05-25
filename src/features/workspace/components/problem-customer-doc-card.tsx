import { CheckCircle2, Circle } from "lucide-react"
import { AppPanel } from "@/components/marketing/app-panel"
import { SectionLabel } from "@/components/marketing/section-label"
import { Progress } from "@/components/ui/progress"
import { CHECKLIST_SECTIONS } from "@/features/workspace/data/checklist-sections"
import type { ProblemCustomerDocRead } from "@/lib/api/types"

type ProblemCustomerDocCardProps = {
  doc: ProblemCustomerDocRead
}

export function ProblemCustomerDocCard({ doc }: ProblemCustomerDocCardProps) {
  const completion = Math.round(doc.completion_percentage)

  return (
    <AppPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionLabel index="03">Problem &amp; customer</SectionLabel>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {completion}%
        </span>
      </div>
      <Progress
        value={doc.completion_percentage}
        aria-label="Problem and customer completion"
        className="mt-3"
      />
      {completion === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Problem &amp; customer unlocks as you share detail in chat.
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        {CHECKLIST_SECTIONS.map((section) => {
          const state = doc.checklist.sections[section.key]

          return (
            <div
              key={section.key}
              className="border-border/60 flex items-start gap-2 rounded-md border px-3 py-2"
            >
              {state.done ? (
                <CheckCircle2
                  className="text-brand mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{section.label}</p>
                {state.summary ? (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-5">
                    {state.summary}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </AppPanel>
  )
}
