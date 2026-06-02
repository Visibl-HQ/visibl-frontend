"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Archive,
  Check,
  History,
  MessageSquareText,
  Pencil,
  Search,
  RotateCcw,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type {
  CompanyMapCandidateRead,
  CompanyMapFieldRead,
} from "@/lib/api/types"

type CompanyMapCandidateQueueProps = {
  candidates: CompanyMapCandidateRead[]
  reviewedCandidates: CompanyMapCandidateRead[]
  fields: CompanyMapFieldRead[]
  pendingCandidateId: string | null
  staleCandidateId: string | null
  onAccept: (candidate: CompanyMapCandidateRead) => void | Promise<void>
  onReplace: (
    candidate: CompanyMapCandidateRead,
    expectedRevisionId: string
  ) => void | Promise<void>
  onEditAccept: (
    candidate: CompanyMapCandidateRead,
    value: string
  ) => void | Promise<void>
  onEditReplace: (
    candidate: CompanyMapCandidateRead,
    value: string,
    expectedRevisionId: string
  ) => void | Promise<void>
  onReject: (candidate: CompanyMapCandidateRead) => void | Promise<void>
  onArchive: (candidate: CompanyMapCandidateRead) => void | Promise<void>
  onClarify: (candidate: CompanyMapCandidateRead) => void | Promise<void>
  onSelectField: (field: CompanyMapFieldRead) => void
  onInspectSource: (candidate: CompanyMapCandidateRead) => void
}

function hasSourceReference(candidate: CompanyMapCandidateRead): boolean {
  return Boolean(
    candidate.source_message_public_id ||
    candidate.source_pin_public_id ||
    candidate.source_document_id ||
    candidate.source_document_label
  )
}

export function CompanyMapCandidateQueue({
  candidates,
  reviewedCandidates,
  fields,
  pendingCandidateId,
  staleCandidateId,
  onAccept,
  onReplace,
  onEditAccept,
  onEditReplace,
  onReject,
  onArchive,
  onClarify,
  onSelectField,
  onInspectSource,
}: CompanyMapCandidateQueueProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState("")
  const fieldByKey = useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields]
  )

  if (candidates.length === 0 && reviewedCandidates.length === 0) {
    return (
      <section className="border-border/70 bg-surface-elevated/60 rounded-lg border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Candidate review</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Suggested Company Map updates appear here after capture.
            </p>
          </div>
          <span className="text-muted-foreground text-xs">0 open</span>
        </div>
      </section>
    )
  }

  return (
    <section className="border-border/70 bg-surface-elevated/60 rounded-lg border">
      <div className="border-border/70 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Candidate review</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Accept updates into the Company Map, or reject them as audit-visible
            suggestions.
          </p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          {candidates.length} open
        </span>
      </div>
      {candidates.length > 0 ? (
        <div className="divide-border/70 max-h-[38rem] divide-y overflow-y-auto overscroll-contain">
          {candidates.map((candidate) => {
            const field = fieldByKey.get(candidate.field_key)
            const isEditing = editingId === candidate.public_id
            const isPending = pendingCandidateId === candidate.public_id
            const currentRevisionId = field?.revision_id ?? null
            const isStaleAgainstCurrent = Boolean(
              currentRevisionId &&
              candidate.baseline_revision_id !== currentRevisionId
            )
            const showReplaceFlow =
              staleCandidateId === candidate.public_id || isStaleAgainstCurrent

            return (
              <article key={candidate.public_id} className="px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      {candidate.is_conflict ? (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-fuchsia-600"
                          aria-label="Contradiction"
                        />
                      ) : null}
                      <p className="truncate text-sm font-medium">
                        {candidate.field_label}
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {candidate.rationale}
                    </p>
                  </div>
                  {field ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 text-xs"
                      onClick={() => onSelectField(field)}
                    >
                      Inspect field
                    </Button>
                  ) : null}
                </div>

                {candidate.conflict_summary ? (
                  <p className="mt-2 rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-1.5 text-xs text-fuchsia-800 dark:border-fuchsia-950 dark:bg-fuchsia-950/30 dark:text-fuchsia-200">
                    {candidate.conflict_summary}
                  </p>
                ) : null}
                {showReplaceFlow ? (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="font-medium">
                      This suggestion was captured before the current field
                      revision.
                    </p>
                    <p className="mt-1">
                      Replace only if this source should overwrite the current
                      value.
                    </p>
                  </div>
                ) : null}

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={draftValue}
                      className="min-h-24 text-sm"
                      onChange={(event) => setDraftValue(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {!showReplaceFlow ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || draftValue.trim().length === 0}
                          onClick={async () => {
                            try {
                              await onEditAccept(candidate, draftValue)
                              setEditingId(null)
                            } catch {
                              // The parent owns the visible error; keep the draft for retry.
                            }
                          }}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                          Accept edit
                        </Button>
                      ) : null}
                      {showReplaceFlow && currentRevisionId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending || draftValue.trim().length === 0}
                          onClick={async () => {
                            try {
                              await onEditReplace(
                                candidate,
                                draftValue,
                                currentRevisionId
                              )
                              setEditingId(null)
                            } catch {
                              // The parent owns the visible error; keep the draft for retry.
                            }
                          }}
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          Replace with edit
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="bg-muted/40 mt-3 rounded-md px-2.5 py-2 text-sm">
                      {candidate.suggested_value}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => onAccept(candidate)}
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        Accept
                      </Button>
                      {showReplaceFlow && currentRevisionId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            onReplace(candidate, currentRevisionId)
                          }
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          Replace current
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          setEditingId(candidate.public_id)
                          setDraftValue(candidate.suggested_value)
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => onClarify(candidate)}
                      >
                        <Search className="size-3.5" aria-hidden="true" />
                        Ask
                      </Button>
                      {hasSourceReference(candidate) ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Open chat context for ${candidate.field_label} candidate source`}
                          title="Open chat context"
                          onClick={() => onInspectSource(candidate)}
                        >
                          <MessageSquareText
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => onReject(candidate)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={isPending}
                        aria-label={`Archive ${candidate.field_label} candidate`}
                        onClick={() => onArchive(candidate)}
                      >
                        <Archive className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      ) : null}
      {reviewedCandidates.length > 0 ? (
        <div className="border-border/70 border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <History
              className="text-muted-foreground size-3.5"
              aria-hidden="true"
            />
            <h4 className="text-xs font-semibold">Reviewed candidates</h4>
            <span className="text-muted-foreground text-xs">
              {reviewedCandidates.length}
            </span>
          </div>
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto overscroll-contain">
            {reviewedCandidates.map((candidate) => (
              <div
                key={candidate.public_id}
                className="bg-muted/35 rounded-md px-2.5 py-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {candidate.field_label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 capitalize">
                      {candidate.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  {hasSourceReference(candidate) ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Open chat context for reviewed ${candidate.field_label} candidate source`}
                      title="Open chat context"
                      onClick={() => onInspectSource(candidate)}
                    >
                      <MessageSquareText
                        className="size-3.5"
                        aria-hidden="true"
                      />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2">{candidate.suggested_value}</p>
                {candidate.clarification_question ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {candidate.clarification_question}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
