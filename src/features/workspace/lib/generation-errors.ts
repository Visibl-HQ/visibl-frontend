/**
 * User-facing copy for generation errors (mirrors ingestion-errors.ts).
 * Never surfaces raw provider/internal errors.
 */

import { ApiError } from "@/lib/api/client"
import {
  GenerationCanceledError,
  GenerationFailedError,
  GenerationTimeoutError,
} from "@/features/workspace/lib/wait-for-generation"

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function describeGenerationError(error: unknown): string {
  if (error instanceof GenerationFailedError) {
    return error.safeError
  }
  if (error instanceof GenerationTimeoutError) {
    return error.message
  }
  if (error instanceof GenerationCanceledError) {
    return "Generation was canceled."
  }
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return (
        error.body?.error?.message ??
        "This artifact still needs evidence before it can be drafted."
      )
    }
    if (error.status === 403 || error.status === 404) {
      return "This artifact is no longer available."
    }
    return "Something went wrong starting the draft. Try again."
  }
  return "Something went wrong starting the draft. Try again."
}
