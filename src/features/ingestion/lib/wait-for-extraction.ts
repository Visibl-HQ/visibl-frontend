import { getExtractionJob } from "@/lib/api/ingestion"
import type { ExtractionJobStatus, IngestionPreview } from "@/lib/api/types"

const DEFAULT_POLL_MS = 2000

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)

    function onAbort() {
      window.clearTimeout(timeout)
      reject(new DOMException("Aborted", "AbortError"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

export type WaitForExtractionOptions = {
  signal?: AbortSignal
  onStatus?: (status: ExtractionJobStatus) => void
}

export async function waitForExtraction(
  projectId: string,
  jobId: string,
  options?: WaitForExtractionOptions
): Promise<IngestionPreview> {
  const { signal, onStatus } = options ?? {}

  for (;;) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }

    const job = await getExtractionJob(projectId, jobId)
    onStatus?.(job.status)

    if (job.status === "succeeded") {
      if (!job.preview) {
        throw new Error("Extraction finished without a preview.")
      }

      return job.preview
    }

    if (job.status === "failed") {
      throw new Error(job.failure_reason ?? "Extraction failed.")
    }

    if (job.status === "cancelled") {
      throw new Error("Extraction was cancelled.")
    }

    await sleep(job.poll_interval_ms ?? DEFAULT_POLL_MS, signal)
  }
}
