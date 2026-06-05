/**
 * Activity copy for in-flight generation.
 *
 * Server event messages win; the fallbacks narrate the product's judgment
 * (evidence-gated drafting) instead of generic loading copy — this wait is
 * the moment the differentiation is legible.
 */

import type { GenerationJobSnapshot } from "@/features/workspace/lib/wait-for-generation"

/** Cycling trust-narrative copy shown while the model drafts. */
export const DRAFTING_NARRATIVE: readonly string[] = [
  "Reading only your confirmed sources…",
  "Checking support for each claim…",
  "Labeling gaps honestly instead of inventing facts…",
  "Attaching source references to every section…",
]

const STATUS_FALLBACKS: Record<string, string> = {
  queued: "Queued — snapshotting your sources…",
  running: "Reading only your confirmed sources…",
  succeeded: "Draft ready.",
  failed: "Generation stopped safely.",
  canceled: "Generation canceled.",
}

export function activityLabelForJob(job: GenerationJobSnapshot): string {
  const lastEvent = job.events.at(-1)
  if (lastEvent?.message) {
    return lastEvent.message
  }
  return STATUS_FALLBACKS[job.status] ?? "Working…"
}

export function narrativeLabelAt(tick: number): string {
  return (
    DRAFTING_NARRATIVE[Math.floor(tick) % DRAFTING_NARRATIVE.length] ??
    "Working…"
  )
}
