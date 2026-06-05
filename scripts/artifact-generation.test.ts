/**
 * Behavioral tests for the generation polling core (goal-010 blocker B5).
 *
 * The previous implementation polled exactly once and re-enabled the button
 * regardless of job state. These tests drive the real poller through every
 * terminal and non-terminal transition with injected getJob/sleep/now, so a
 * regression to single-poll behavior fails loudly.
 *
 * Runs via `node --import tsx --test` (tsx strips types; no test framework).
 */

import assert from "node:assert/strict"
import { test } from "node:test"

import {
  GenerationCanceledError,
  GenerationFailedError,
  GenerationTimeoutError,
  waitForGeneration,
  type GenerationJobSnapshot,
} from "../src/features/workspace/lib/wait-for-generation"
import {
  DRAFTING_NARRATIVE,
  activityLabelForJob,
} from "../src/features/workspace/lib/generation-events"

function job(partial: Partial<GenerationJobSnapshot>): GenerationJobSnapshot {
  return {
    public_id: "job-1",
    status: "queued",
    progress: 0,
    poll_interval_ms: 25,
    safe_error: null,
    events: [],
    result_version: null,
    metadata_json: {},
    ...partial,
  }
}

function sequenceGetJob(sequence: GenerationJobSnapshot[]) {
  let index = 0
  const calls: number[] = []
  return {
    calls,
    getJob: async () => {
      calls.push(index)
      const item = sequence[Math.min(index, sequence.length - 1)]
      index += 1
      return item
    },
  }
}

const instantSleep = async () => {}

test("polls queued -> running -> succeeded and returns the result version", async () => {
  const version = { public_id: "ver-1", version_number: 1 }
  const { getJob, calls } = sequenceGetJob([
    job({ status: "queued" }),
    job({ status: "running", progress: 10 }),
    job({ status: "succeeded", progress: 100, result_version: version as never }),
  ])
  const seen: string[] = []

  const result = await waitForGeneration("proj", "one_pager", "job-1", {
    getJob,
    sleep: instantSleep,
    onJob: (j) => seen.push(j.status),
  })

  assert.equal((result as { public_id: string }).public_id, "ver-1")
  assert.deepEqual(seen, ["queued", "running", "succeeded"])
  assert.equal(calls.length, 3, "must poll until terminal, not once")
})

test("failed job throws GenerationFailedError carrying the safe error", async () => {
  const { getJob } = sequenceGetJob([
    job({ status: "running" }),
    job({ status: "failed", safe_error: "Generation failed safely." }),
  ])

  await assert.rejects(
    waitForGeneration("proj", "one_pager", "job-1", { getJob, sleep: instantSleep }),
    (error: unknown) => {
      assert.ok(error instanceof GenerationFailedError)
      assert.equal(error.safeError, "Generation failed safely.")
      return true
    }
  )
})

test("canceled job throws GenerationCanceledError", async () => {
  const { getJob } = sequenceGetJob([job({ status: "canceled" })])
  await assert.rejects(
    waitForGeneration("proj", "one_pager", "job-1", { getJob, sleep: instantSleep }),
    GenerationCanceledError
  )
})

test("bounded timeout throws GenerationTimeoutError while job still runs server-side", async () => {
  let clock = 0
  const { getJob } = sequenceGetJob([job({ status: "running" })])

  await assert.rejects(
    waitForGeneration("proj", "one_pager", "job-1", {
      getJob,
      sleep: async () => {
        clock += 60_000
      },
      now: () => clock,
      maxDurationMs: 120_000,
    }),
    (error: unknown) => {
      assert.ok(error instanceof GenerationTimeoutError)
      return true
    }
  )
})

test("pre-aborted signal rejects with AbortError before polling", async () => {
  const controller = new AbortController()
  controller.abort()
  let polled = false

  await assert.rejects(
    waitForGeneration("proj", "one_pager", "job-1", {
      signal: controller.signal,
      getJob: async () => {
        polled = true
        return job({ status: "succeeded" })
      },
      sleep: instantSleep,
    }),
    (error: unknown) => (error as Error).name === "AbortError"
  )
  assert.equal(polled, false)
})

test("honors server poll_interval_ms between polls", async () => {
  const sleeps: number[] = []
  const { getJob } = sequenceGetJob([
    job({ status: "queued", poll_interval_ms: 1234 }),
    job({
      status: "succeeded",
      result_version: { public_id: "v" } as never,
      poll_interval_ms: 1234,
    }),
  ])

  await waitForGeneration("proj", "one_pager", "job-1", {
    getJob,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
  })

  assert.deepEqual(sleeps, [1234])
})

test("succeeded without a result version is treated as a failure, not silence", async () => {
  const { getJob } = sequenceGetJob([job({ status: "succeeded", result_version: null })])
  await assert.rejects(
    waitForGeneration("proj", "one_pager", "job-1", { getJob, sleep: instantSleep }),
    GenerationFailedError
  )
})

test("activity labels prefer server event messages and fall back to trust narrative", () => {
  const withMessage = activityLabelForJob(
    job({
      status: "running",
      events: [
        {
          event_type: "running",
          message: "Reading only your confirmed sources and drafting from evidence.",
          payload: {},
          created_at: "2026-06-05T00:00:00Z",
        },
      ],
    })
  )
  assert.match(withMessage, /confirmed sources/)

  const fallback = activityLabelForJob(job({ status: "running", events: [] }))
  assert.ok(fallback.length > 0)
  assert.ok(DRAFTING_NARRATIVE.length >= 3, "trust narrative needs cycling copy")
})
