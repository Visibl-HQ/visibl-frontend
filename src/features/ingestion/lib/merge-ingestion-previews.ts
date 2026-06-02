import type { IngestionPreview, ProposedDocSection } from "@/lib/api/types"

const CONFIDENCE_RANK = {
  low: 0,
  medium: 1,
  high: 2,
} as const

function mergeDocSections(
  sections: ProposedDocSection[]
): ProposedDocSection[] {
  const byKey = new Map<string, ProposedDocSection>()

  for (const section of sections) {
    const existing = byKey.get(section.section)

    if (!existing) {
      byKey.set(section.section, section)
      continue
    }

    byKey.set(section.section, {
      ...section,
      done: existing.done || section.done,
      summary: [existing.summary, section.summary].filter(Boolean).join("\n\n"),
    })
  }

  return Array.from(byKey.values())
}

export function mergeIngestionPreviews(
  previews: IngestionPreview[]
): IngestionPreview {
  if (previews.length === 0) {
    return {
      summary: "",
      confidence: "medium",
      proposed_pins: [],
      proposed_doc_sections: [],
    }
  }

  if (previews.length === 1) {
    return previews[0]!
  }

  const confidence = previews.reduce<IngestionPreview["confidence"]>(
    (lowest, preview) =>
      CONFIDENCE_RANK[preview.confidence] < CONFIDENCE_RANK[lowest]
        ? preview.confidence
        : lowest,
    "high"
  )

  const summary = previews
    .map((preview, index) => `Import ${index + 1}: ${preview.summary}`)
    .join("\n\n")

  return {
    summary,
    confidence,
    proposed_pins: previews.flatMap((preview) => preview.proposed_pins),
    proposed_doc_sections: mergeDocSections(
      previews.flatMap((preview) => preview.proposed_doc_sections)
    ),
  }
}
