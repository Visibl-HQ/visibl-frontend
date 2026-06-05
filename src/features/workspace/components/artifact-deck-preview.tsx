"use client"

/**
 * Slide-card preview for pitch_deck_draft versions.
 *
 * Groups evidence-backed sections under the generated slide plan with
 * founder-deliverable speaker notes. Falls back to the standard section
 * preview when no slide plan exists.
 */

import { useMemo } from "react"
import { Presentation } from "lucide-react"

import { SupportBadge } from "@/features/workspace/components/readiness-labels"
import type { ArtifactVersionRead } from "@/lib/api/types"

export function ArtifactDeckPreview({
  version,
}: {
  version: ArtifactVersionRead
}) {
  const { content } = version
  const sectionsById = useMemo(
    () => new Map(content.sections.map((section) => [section.id, section])),
    [content.sections]
  )
  const slides = content.slides ?? []

  if (slides.length === 0) {
    return null
  }

  return (
    <section aria-label="Slide plan" className="mt-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Presentation className="size-4" aria-hidden="true" />
        Slide plan ({slides.length} slides)
      </h4>
      <ol className="mt-2 grid gap-2">
        {slides.map((slide, index) => {
          const slideSections = slide.section_ids
            .map((id) => sectionsById.get(id))
            .filter((section) => section !== undefined)
          return (
            <li
              key={slide.id}
              className="border-border/70 bg-background rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground mr-1.5 text-xs tabular-nums">
                    {index + 1}.
                  </span>
                  {slide.title}
                </p>
                <div className="flex shrink-0 gap-1">
                  {slideSections.map((section) => (
                    <SupportBadge
                      key={section.id}
                      label={section.support_label}
                      className="px-1.5 text-[10px]"
                    />
                  ))}
                </div>
              </div>
              {slideSections.map((section) =>
                section.support_label === "Missing" ? (
                  <p
                    key={section.id}
                    className="text-muted-foreground mt-1.5 text-xs italic"
                  >
                    {section.label}: needs evidence before this slide can make a
                    claim.
                  </p>
                ) : (
                  <p
                    key={section.id}
                    className="mt-1.5 line-clamp-3 text-xs leading-relaxed"
                  >
                    {section.value}
                  </p>
                )
              )}
              {slide.speaker_notes ? (
                <details className="mt-2">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium select-none">
                    Speaker notes
                  </summary>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {slide.speaker_notes}
                  </p>
                </details>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
