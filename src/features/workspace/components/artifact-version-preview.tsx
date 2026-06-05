"use client"

/**
 * Native renderer for generated version content.
 *
 * Renders content_json.sections directly (not rendered_markdown) so every
 * section keeps its support badge, source references, and caveats — the
 * honest-gap evidence trail IS the product. Missing/Weak sections become
 * "unlock" affordances that route the founder to the exact next question.
 */

import { useMemo, useState } from "react"
import { CircleHelp, MessageCircleQuestion, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SupportBadge } from "@/features/workspace/components/readiness-labels"
import type {
  ArtifactContentSection,
  ArtifactRead,
  ArtifactSourceRef,
  ArtifactVersionRead,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

function SourceChip({ source }: { source: ArtifactSourceRef }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <span className="inline-flex max-w-full flex-col">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className={cn(
          "border-border/70 bg-background text-muted-foreground inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
          "hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
        )}
      >
        <span className="truncate">{source.label}</span>
        <CircleHelp className="size-3 shrink-0" aria-hidden="true" />
      </button>
      {expanded && source.summary ? (
        <span className="text-muted-foreground mt-1 text-[11px] leading-snug">
          {source.summary}
        </span>
      ) : null}
    </span>
  )
}

function nextQuestionForSection(
  section: ArtifactContentSection,
  artifact: ArtifactRead
): string {
  const blocker = artifact.blockers.find(
    (item) => item.field_key === section.field_key
  )
  return (
    blocker?.next_action.label ??
    `Tell me about your ${section.label.toLowerCase()}.`
  )
}

function SectionBlock({
  section,
  artifact,
  onAskInChat,
}: {
  section: ArtifactContentSection
  artifact: ArtifactRead
  onAskInChat?: ((question: string) => void) | undefined
}) {
  const isGap =
    section.support_label === "Missing" || section.support_label === "Weak"
  const isMissing = section.support_label === "Missing"

  return (
    <section
      aria-labelledby={`preview-${section.id}`}
      className={cn(
        "rounded-md py-3 pr-1 pl-3",
        isGap && "border-l-2",
        isMissing
          ? "border-rose-300 dark:border-rose-800"
          : section.support_label === "Weak"
            ? "border-amber-300 dark:border-amber-800"
            : "pl-3"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`preview-${section.id}`} className="text-sm font-semibold">
          {section.label}
        </h4>
        <SupportBadge label={section.support_label} className="shrink-0" />
      </div>

      {isMissing ? (
        <p className="text-muted-foreground mt-2 text-sm italic">
          No evidence yet — this section stays empty instead of inventing a
          claim.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
          {section.value}
        </p>
      )}

      {section.source_refs.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {section.source_refs.map((source) => (
            <SourceChip key={source.id} source={source} />
          ))}
        </div>
      ) : null}

      {section.caveats.map((caveat) => (
        <p
          key={caveat}
          className="text-muted-foreground mt-2 text-xs leading-snug"
        >
          {caveat}
        </p>
      ))}

      {isGap && onAskInChat ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-brand hover:text-brand mt-2 h-7 gap-1.5 px-2 text-xs"
          onClick={() => onAskInChat(nextQuestionForSection(section, artifact))}
        >
          <MessageCircleQuestion className="size-3.5" aria-hidden="true" />
          Unlock this section in chat
        </Button>
      ) : null}
    </section>
  )
}

export function ArtifactVersionPreview({
  version,
  artifact,
  onRegenerate,
  onAskInChat,
  isRegenerating,
}: {
  version: ArtifactVersionRead
  artifact: ArtifactRead
  onRegenerate?: (() => void) | undefined
  onAskInChat?: ((question: string) => void) | undefined
  isRegenerating?: boolean | undefined
}) {
  const { content } = version
  const counts = useMemo(() => {
    const sourced = content.sections.filter(
      (section) =>
        section.support_label === "Supported" ||
        section.support_label === "Share-safe"
    ).length
    return { sourced, gaps: content.sections.length - sourced }
  }, [content.sections])

  const fallback =
    content.generation_metadata.generator === "deterministic_fallback"
  const firstGap = content.sections.find(
    (section) =>
      section.support_label === "Missing" || section.support_label === "Weak"
  )

  return (
    <article aria-label={`${artifact.name} draft preview`}>
      {version.is_stale ? (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">New evidence is available.</p>
          <p className="mt-0.5">
            {version.stale_reason ??
              "Your Company Map changed since this draft."}
          </p>
          {onRegenerate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-7 gap-1.5 text-xs"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Regenerate with current evidence
            </Button>
          ) : null}
        </div>
      ) : null}

      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[11px]">
            Version {version.version_number}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            Internal draft
          </Badge>
          {fallback ? (
            <Badge
              variant="outline"
              className="border-amber-200 text-[11px] text-amber-800 dark:border-amber-900 dark:text-amber-200"
            >
              Drafted from sources only
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-2 text-base font-semibold">{content.title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{content.summary}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          {counts.sourced} of {content.sections.length} sections are
          source-backed
          {counts.gaps > 0 ? (
            <>
              {" — "}
              {firstGap
                ? `strengthen ${firstGap.label.toLowerCase()} next to make it shareable.`
                : "strengthen the amber sections to make it shareable."}
            </>
          ) : (
            "."
          )}
        </p>
        {fallback ? (
          <p className="text-muted-foreground mt-1 text-xs">
            AI assist was unavailable for this draft — regenerate to retry with
            full drafting.
          </p>
        ) : null}
      </header>

      <div className="divide-border/60 mt-3 grid gap-1 divide-y">
        {content.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            artifact={artifact}
            onAskInChat={onAskInChat}
          />
        ))}
      </div>
    </article>
  )
}
