import { CheckCircle2, Circle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { CHECKLIST_SECTIONS } from "@/features/workspace/data/checklist-sections"
import type { ProblemCustomerDocRead } from "@/lib/api/types"

type ProblemCustomerDocCardProps = {
  doc: ProblemCustomerDocRead
}

export function ProblemCustomerDocCard({ doc }: ProblemCustomerDocCardProps) {
  const completion = Math.round(doc.completion_percentage)

  return (
    <section className="border-border/60 bg-card/40 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-tight">
          Problem &amp; customer
        </h2>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {completion}%
        </span>
      </div>
      <Progress
        value={doc.completion_percentage}
        aria-label="Problem and customer completion"
        className="mt-2 h-1.5"
      />
      {completion === 0 ? (
        <p className="text-muted-foreground mt-2 text-xs leading-5">
          Unlocks as you share detail in chat.
        </p>
      ) : null}
      <div className="mt-3 space-y-1.5">
        {CHECKLIST_SECTIONS.map((section) => {
          const state = doc.checklist.sections[section.key]

          return (
            <div
              key={section.key}
              className="border-border/50 flex items-start gap-2 rounded-md border px-2.5 py-1.5"
            >
              {state.done ? (
                <CheckCircle2
                  className="text-brand mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium">{section.label}</p>
                {state.summary ? (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-4">
                    {state.summary}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
