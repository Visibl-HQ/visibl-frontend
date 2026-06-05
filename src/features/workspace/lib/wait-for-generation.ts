/**
 * Bounded, abortable polling loop for artifact generation jobs.
 *
 * Fixes goal-010 blocker B5: polls until a TERMINAL job state instead of once.
 * getJob / sleep / now are injectable so the loop is unit-testable without a
 * DOM or network (see scripts/artifact-generation.test.ts).
 */

import { getGenerationJob } from "@/lib/api/projects"
import type {
  ArtifactVersionRead,
  GenerationJobEventRead,
  GenerationJobStatus,
} from "@/lib/api/types"

const DEFAULT_POLL_MS = 2000
/**
 * Worst-case server path is initial LLM call + one corrective retry + the
 * deterministic fallback; gpt-5 long-form runs can take tens of seconds each.
 * The job keeps running server-side after this fires — the timeout only stops
 * the foreground wait (the completion toast/resume path picks it up later).
 */
export const DEFAULT_GENERATION_TIMEOUT_MS = 240_000

/** Minimal job shape the poller needs (full GenerationJobRead satisfies it). */
export type GenerationJobSnapshot = {
  public_id: string
  status: GenerationJobStatus
  progress: number
  poll_interval_ms: number
  safe_error: string | null
  events: GenerationJobEventRead[]
  result_version: ArtifactVersionRead | null
  metadata_json: Record<string, unknown>
}

export class GenerationFailedError extends Error {
  readonly safeError: string

  constructor(safeError: string | null) {
    const message =
      safeError ?? "Generation failed safely. The current draft was not changed."
    super(message)
    this.name = "GenerationFailedError"
    this.safeError = message
  }
}

export class GenerationCanceledError extends Error {
  constructor() {
    super("Generation was canceled.")
    this.name = "GenerationCanceledError"
  }
}

export class GenerationTimeoutError extends Error {
  readonly jobId: string

  constructor(jobId: string) {
    super(
      "This is taking longer than expected — the draft will appear in the hub when it finishes."
    )
    this.name = "GenerationTimeoutError"
    this.jobId = jobId
  }
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }

    const timeout = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)

    function onAbort() {
      globalThis.clearTimeout(timeout)
      reject(new DOMException("Aborted", "AbortError"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

export type WaitForGenerationOptions = {
  signal?: AbortSignal
  onJob?: (job: GenerationJobSnapshot) => void
  maxDurationMs?: number
  /** Injectable for tests; defaults to the real API client. */
  getJob?: (
    projectId: string,
    artifactId: string,
    jobId: string
  ) => Promise<GenerationJobSnapshot>
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  now?: () => number
}

export async function waitForGeneration(
  projectId: string,
  artifactId: string,
  jobId: string,
  options?: WaitForGenerationOptions
): Promise<ArtifactVersionRead> {
  const {
    signal,
    onJob,
    maxDurationMs = DEFAULT_GENERATION_TIMEOUT_MS,
    getJob = getGenerationJob,
    sleep = defaultSleep,
    now = () => Date.now(),
  } = options ?? {}

  const startedAt = now()

  for (;;) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }
    if (now() - startedAt > maxDurationMs) {
      throw new GenerationTimeoutError(jobId)
    }

    const job = await getJob(projectId, artifactId, jobId)
    onJob?.(job)

    if (job.status === "succeeded") {
      if (!job.result_version) {
        throw new GenerationFailedError(
          "Generation finished without a draft. Try regenerating."
        )
      }
      return job.result_version
    }
    if (job.status === "failed") {
      throw new GenerationFailedError(job.safe_error)
    }
    if (job.status === "canceled") {
      throw new GenerationCanceledError()
    }

    await sleep(job.poll_interval_ms ?? DEFAULT_POLL_MS, signal)
  }
}
