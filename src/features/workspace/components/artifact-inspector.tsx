"use client"

import { AlertTriangle, ArrowRight, Clock3, Layers3 } from "lucide-react"
import type { ArtifactRead, CompanyMapFieldRead } from "@/lib/api/types"
import { SupportBadge } from "@/features/workspace/components/readiness-labels"

type ArtifactInspectorProps = {
  field: CompanyMapFieldRead | null
  artifact: ArtifactRead | null
}

export function ArtifactInspector({ field, artifact }: ArtifactInspectorProps) {
  if (!field && !artifact) {
    return (
      <section className="border-border/70 bg-background rounded-lg border p-3">
        <p className="text-sm font-medium">Inspector</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Select a field or artifact to inspect evidence, blockers, and next
          actions.
        </p>
      </section>
    )
  }

  return (
    <section className="border-border/70 bg-background rounded-lg border p-3">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        Inspector
      </p>
      {field ? (
        <div className="mt-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold">{field.label}</h3>
            <SupportBadge label={field.support_label} />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {field.value ?? "No sourced value yet."}
          </p>
          {field.stale ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-200">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {field.stale_reason ?? "This field needs review."}
            </p>
          ) : null}
          {field.blockers.length > 0 ? (
            <div className="mt-3 space-y-2">
              {field.blockers.map((blocker) => (
                <div key={blocker.id} className="bg-muted/40 rounded-md p-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    {blocker.message}
                  </p>
                  <p className="text-muted-foreground mt-1 flex gap-1.5 text-xs">
                    <ArrowRight
                      className="mt-0.5 size-3 shrink-0"
                      aria-hidden="true"
                    />
                    {blocker.next_action}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mt-3 text-xs">
              No field blockers remain.
            </p>
          )}
          <EvidenceList evidence={field.evidence} />
        </div>
      ) : null}

      {artifact ? (
        <div className={field ? "mt-4 border-t pt-4" : "mt-2"}>
          <h3 className="text-sm font-semibold">{artifact.name}</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {artifact.readiness} with {artifact.blocker_count} blockers.
          </p>
          <div className="mt-3 space-y-2">
            {artifact.blockers.slice(0, 3).map((blocker) => (
              <div key={blocker.id} className="bg-muted/40 rounded-md p-2">
                <p className="text-xs font-medium">{blocker.message}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {blocker.next_action.label}
                </p>
              </div>
            ))}
          </div>
          <EvidenceList evidence={artifact.evidence.slice(0, 3)} />
        </div>
      ) : null}
    </section>
  )
}

function EvidenceList({
  evidence,
}: {
  evidence: { id: string; label: string; detail: string }[]
}) {
  return (
    <div className="mt-3">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <Layers3 className="size-3.5" aria-hidden="true" />
        Sources
      </p>
      <div className="mt-2 space-y-2">
        {evidence.length > 0 ? (
          evidence.map((item) => (
            <div key={item.id} className="bg-muted/40 rounded-md p-2">
              <p className="text-xs font-medium">{item.label}</p>
              <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                {item.detail}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-xs">No source attached.</p>
        )}
      </div>
    </div>
  )
}
