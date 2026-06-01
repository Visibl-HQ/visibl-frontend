"use client"

import { AlertTriangle, ArrowRight, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  CompanyMapCandidateRead,
  CompanyMapFieldRead,
  CompanyMapRead,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { CompanyMapCandidateQueue } from "@/features/workspace/components/company-map-candidate-queue"
import { SupportBadge } from "@/features/workspace/components/readiness-labels"

type CompanyMapPanelProps = {
  companyMap: CompanyMapRead
  selectedFieldKey: string | null
  pendingCandidateId: string | null
  staleCandidateId: string | null
  onSelectField: (field: CompanyMapFieldRead) => void
  onAcceptCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onReplaceCandidate: (
    candidate: CompanyMapCandidateRead,
    expectedRevisionId: string
  ) => void | Promise<void>
  onEditAcceptCandidate: (
    candidate: CompanyMapCandidateRead,
    value: string
  ) => void | Promise<void>
  onEditReplaceCandidate: (
    candidate: CompanyMapCandidateRead,
    value: string,
    expectedRevisionId: string
  ) => void | Promise<void>
  onRejectCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onArchiveCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onClarifyCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onInspectCandidateSource: (candidate: CompanyMapCandidateRead) => void
}

export function CompanyMapPanel({
  companyMap,
  selectedFieldKey,
  pendingCandidateId,
  staleCandidateId,
  onSelectField,
  onAcceptCandidate,
  onReplaceCandidate,
  onEditAcceptCandidate,
  onEditReplaceCandidate,
  onRejectCandidate,
  onArchiveCandidate,
  onClarifyCandidate,
  onInspectCandidateSource,
}: CompanyMapPanelProps) {
  const fields = companyMap.groups.flatMap((group) => group.fields)

  return (
    <section
      data-testid="company-map"
      className="bg-background flex min-h-0 flex-1 flex-col"
      aria-labelledby="company-map-title"
    >
      <div className="border-border/70 shrink-0 border-b px-4 py-4 sm:px-6">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Company Map
        </p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="company-map-title" className="text-xl font-semibold">
              Source-backed company judgment
            </h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Fields move from missing to share-safe only when evidence supports
              them. Contradictions stay visible until resolved.
            </p>
          </div>
          <div className="text-muted-foreground text-xs">
            {companyMap.groups.length} groups tracked
          </div>
        </div>
        {companyMap.capture_receipt ? (
          <div
            className="border-border/70 bg-muted/30 mt-3 flex flex-wrap gap-2 rounded-lg border px-3 py-2 text-xs"
            aria-live="polite"
          >
            <span className="font-medium">Captured</span>
            <span>{companyMap.capture_receipt.pin_count} pins</span>
            <span>
              {companyMap.capture_receipt.candidate_count} suggested Company Map
              updates
            </span>
            <span>
              {companyMap.capture_receipt.contradiction_count} contradictions
            </span>
          </div>
        ) : null}
      </div>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
      >
        <div className="mb-4">
          <CompanyMapCandidateQueue
            candidates={companyMap.candidates}
            reviewedCandidates={companyMap.reviewed_candidates}
            fields={fields}
            pendingCandidateId={pendingCandidateId}
            staleCandidateId={staleCandidateId}
            onAccept={onAcceptCandidate}
            onReplace={onReplaceCandidate}
            onEditAccept={onEditAcceptCandidate}
            onEditReplace={onEditReplaceCandidate}
            onReject={onRejectCandidate}
            onArchive={onArchiveCandidate}
            onClarify={onClarifyCandidate}
            onSelectField={onSelectField}
            onInspectSource={onInspectCandidateSource}
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {companyMap.groups.map((group) => (
            <section
              key={group.key}
              className="border-border/80 bg-surface-elevated/70 rounded-lg border"
              aria-labelledby={`${group.key}-title`}
            >
              <div className="border-border/70 border-b px-4 py-3">
                <h3 id={`${group.key}-title`} className="font-medium">
                  {group.label}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  {group.description}
                </p>
              </div>
              <div className="divide-border/70 divide-y">
                {group.fields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    className={cn(
                      "hover:bg-muted/40 focus-visible:ring-ring/50 grid w-full grid-cols-1 gap-2 px-4 py-3 text-left outline-none focus-visible:ring-2 sm:grid-cols-[minmax(0,1fr)_auto]",
                      selectedFieldKey === field.key && "bg-muted/50"
                    )}
                    aria-pressed={selectedFieldKey === field.key}
                    onClick={() => onSelectField(field)}
                  >
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {field.label}
                        </span>
                        {field.stale ? (
                          <Clock3
                            className="size-3.5 shrink-0 text-amber-600"
                            aria-label="Stale"
                          />
                        ) : null}
                        {field.support_label === "Contradicted" ? (
                          <AlertTriangle
                            className="size-3.5 shrink-0 text-fuchsia-600"
                            aria-label="Contradicted"
                          />
                        ) : null}
                      </span>
                      <span className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {field.value ?? "No sourced value yet."}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 sm:justify-end">
                      <SupportBadge label={field.support_label} />
                      <ArrowRight
                        className="text-muted-foreground size-3.5"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const firstBlockedField = companyMap.groups
                .flatMap((group) => group.fields)
                .find((field) => field.blockers.length > 0)
              if (firstBlockedField) {
                onSelectField(firstBlockedField)
              }
            }}
          >
            Inspect next blocker
          </Button>
        </div>
      </div>
    </section>
  )
}
