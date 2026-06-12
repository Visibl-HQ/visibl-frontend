"use client"

/**
 * Generation flow state machine (modeled on use-ingestion-flow).
 *
 * - Per-artifact duplicate-click guard; multiple artifacts may generate
 *   concurrently.
 * - Jobs continue server-side after navigation: the in-flight job id is kept
 *   in sessionStorage and `resume()` re-attaches the poller on return.
 * - Completion raises a toast and `onGenerationComplete` (wired to the
 *   workspace capture refresh), so hub cards reflect the new version.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  activityLabelForJob,
  narrativeLabelAt,
} from "@/features/workspace/lib/generation-events"
import {
  describeGenerationError,
  isAbortError,
} from "@/features/workspace/lib/generation-errors"
import {
  GenerationTimeoutError,
  waitForGeneration,
  type GenerationJobSnapshot,
} from "@/features/workspace/lib/wait-for-generation"
import { generateArtifact } from "@/lib/api/projects"
import type { ArtifactVersionRead } from "@/lib/api/types"

export type GenerationPhase =
  | "idle"
  | "starting"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "timeout"

export type GenerationState = {
  phase: GenerationPhase
  progress: number
  activityLabel: string | null
  error: string | null
  jobId: string | null
  resultVersion: ArtifactVersionRead | null
}

const IDLE_STATE: GenerationState = {
  phase: "idle",
  progress: 0,
  activityLabel: null,
  error: null,
  jobId: null,
  resultVersion: null,
}

const IN_FLIGHT_PHASES: ReadonlySet<GenerationPhase> = new Set([
  "starting",
  "queued",
  "running",
])

function storageKey(projectId: string, artifactId: string): string {
  return `visibl:generation:${projectId}:${artifactId}`
}

function idempotencyStorageKey(projectId: string, artifactId: string): string {
  return `visibl:generation-idempotency:${projectId}:${artifactId}`
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function rememberJob(projectId: string, artifactId: string, jobId: string) {
  try {
    sessionStorage.setItem(storageKey(projectId, artifactId), jobId)
  } catch {
    // Private mode / storage full — resume is best-effort polish.
  }
}

function forgetJob(projectId: string, artifactId: string) {
  try {
    sessionStorage.removeItem(storageKey(projectId, artifactId))
  } catch {
    // ignore
  }
}

function rememberedJob(projectId: string, artifactId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(projectId, artifactId))
  } catch {
    return null
  }
}

function pendingIdempotencyKey(projectId: string, artifactId: string): string {
  try {
    const key = idempotencyStorageKey(projectId, artifactId)
    const existing = sessionStorage.getItem(key)
    if (existing) {
      return existing
    }
    const created = newIdempotencyKey()
    sessionStorage.setItem(key, created)
    return created
  } catch {
    return newIdempotencyKey()
  }
}

function forgetPendingIdempotencyKey(projectId: string, artifactId: string) {
  try {
    sessionStorage.removeItem(idempotencyStorageKey(projectId, artifactId))
  } catch {
    // ignore
  }
}

export type UseArtifactGenerationOptions = {
  projectId: string
  onGenerationComplete?: (
    artifactId: string,
    version: ArtifactVersionRead
  ) => void | Promise<void>
}

export function useArtifactGeneration({
  projectId,
  onGenerationComplete,
}: UseArtifactGenerationOptions) {
  const [states, setStates] = useState<Record<string, GenerationState>>({})
  const controllersRef = useRef<Map<string, AbortController>>(new Map())
  const ticksRef = useRef<Map<string, number>>(new Map())
  // Synchronous in-flight guard: two clicks in the same tick share the same
  // `states` snapshot, so the phase check alone cannot stop a double submit.
  const startingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const controllers = controllersRef.current
    return () => {
      for (const controller of controllers.values()) {
        controller.abort()
      }
      controllers.clear()
    }
  }, [])

  const patchState = useCallback(
    (artifactId: string, patch: Partial<GenerationState>) => {
      setStates((previous) => ({
        ...previous,
        [artifactId]: { ...(previous[artifactId] ?? IDLE_STATE), ...patch },
      }))
    },
    []
  )

  const stateFor = useCallback(
    (artifactId: string): GenerationState => states[artifactId] ?? IDLE_STATE,
    [states]
  )

  const handleJobUpdate = useCallback(
    (artifactId: string, job: GenerationJobSnapshot) => {
      const tick = (ticksRef.current.get(artifactId) ?? 0) + 1
      ticksRef.current.set(artifactId, tick)
      const serverLabel = activityLabelForJob(job)
      patchState(artifactId, {
        phase: job.status === "queued" ? "queued" : "running",
        progress: job.progress,
        // Cycle the trust narrative so the wait never looks frozen even when
        // the server message hasn't changed between polls.
        activityLabel:
          job.status === "running" && tick % 2 === 0
            ? narrativeLabelAt(tick / 2)
            : serverLabel,
        jobId: job.public_id,
      })
    },
    [patchState]
  )

  const pollToCompletion = useCallback(
    async (artifactId: string, jobId: string) => {
      const controller = new AbortController()
      controllersRef.current.set(artifactId, controller)
      try {
        const version = await waitForGeneration(projectId, artifactId, jobId, {
          signal: controller.signal,
          onJob: (job) => handleJobUpdate(artifactId, job),
        })
        forgetJob(projectId, artifactId)
        patchState(artifactId, {
          phase: "succeeded",
          progress: 100,
          activityLabel: "Draft ready.",
          error: null,
          resultVersion: version,
        })
        toast.success("Your draft is ready", {
          description: "A new source-backed internal draft was created.",
        })
        await onGenerationComplete?.(artifactId, version)
      } catch (error) {
        if (isAbortError(error)) {
          patchState(artifactId, { ...IDLE_STATE })
          return
        }
        if (error instanceof GenerationTimeoutError) {
          patchState(artifactId, {
            phase: "timeout",
            activityLabel: null,
            error: describeGenerationError(error),
          })
          return
        }
        forgetJob(projectId, artifactId)
        patchState(artifactId, {
          phase: "failed",
          activityLabel: null,
          error: describeGenerationError(error),
        })
      } finally {
        controllersRef.current.delete(artifactId)
      }
    },
    [handleJobUpdate, onGenerationComplete, patchState, projectId]
  )

  const generate = useCallback(
    async (artifactId: string) => {
      if (
        startingRef.current.has(artifactId) ||
        IN_FLIGHT_PHASES.has(stateFor(artifactId).phase)
      ) {
        return // duplicate-click guard (sync ref + state phase)
      }
      startingRef.current.add(artifactId)
      patchState(artifactId, {
        ...IDLE_STATE,
        phase: "starting",
        activityLabel: "Snapshotting your sources…",
      })
      try {
        const idempotencyKey = pendingIdempotencyKey(projectId, artifactId)
        const job = await generateArtifact(projectId, artifactId, {
          idempotency_key: idempotencyKey,
        })
        rememberJob(projectId, artifactId, job.public_id)
        forgetPendingIdempotencyKey(projectId, artifactId)
        handleJobUpdate(artifactId, job)
        if (job.status === "succeeded" && job.result_version) {
          // Inline fallback path completed in-request.
          forgetJob(projectId, artifactId)
          patchState(artifactId, {
            phase: "succeeded",
            progress: 100,
            activityLabel: "Draft ready.",
            error: null,
            resultVersion: job.result_version,
          })
          toast.success("Your draft is ready", {
            description: "A new source-backed internal draft was created.",
          })
          await onGenerationComplete?.(artifactId, job.result_version)
          return
        }
        if (job.status === "failed") {
          forgetJob(projectId, artifactId)
          forgetPendingIdempotencyKey(projectId, artifactId)
          patchState(artifactId, {
            phase: "failed",
            activityLabel: null,
            error: job.safe_error ?? "Generation stopped safely.",
          })
          return
        }
        await pollToCompletion(artifactId, job.public_id)
      } catch (error) {
        patchState(artifactId, {
          phase: "failed",
          activityLabel: null,
          error: describeGenerationError(error),
        })
      } finally {
        startingRef.current.delete(artifactId)
      }
    },
    [
      handleJobUpdate,
      onGenerationComplete,
      patchState,
      pollToCompletion,
      projectId,
      stateFor,
    ]
  )

  /** Re-attach after a foreground timeout (the job kept running server-side). */
  const recheck = useCallback(
    (artifactId: string) => {
      const jobId =
        stateFor(artifactId).jobId ?? rememberedJob(projectId, artifactId)
      if (!jobId || IN_FLIGHT_PHASES.has(stateFor(artifactId).phase)) {
        return
      }
      patchState(artifactId, {
        phase: "running",
        jobId,
        error: null,
        activityLabel: "Checking on your draft…",
      })
      void pollToCompletion(artifactId, jobId)
    },
    [patchState, pollToCompletion, projectId, stateFor]
  )

  /** Re-attach to a job started before navigation (call on detail open). */
  const resume = useCallback(
    (artifactId: string) => {
      if (IN_FLIGHT_PHASES.has(stateFor(artifactId).phase)) {
        return
      }
      const jobId = rememberedJob(projectId, artifactId)
      if (!jobId) {
        return
      }
      patchState(artifactId, {
        ...IDLE_STATE,
        phase: "running",
        jobId,
        activityLabel: "Checking on your draft…",
      })
      void pollToCompletion(artifactId, jobId)
    },
    [patchState, pollToCompletion, projectId, stateFor]
  )

  const dismiss = useCallback(
    (artifactId: string) => {
      controllersRef.current.get(artifactId)?.abort()
      patchState(artifactId, { ...IDLE_STATE })
    },
    [patchState]
  )

  return { stateFor, generate, resume, recheck, dismiss }
}
