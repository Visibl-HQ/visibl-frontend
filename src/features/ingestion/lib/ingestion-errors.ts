import { ApiError } from "@/lib/api/client"

/** Thrown when the browser PUT to the presigned S3 URL fails (not an API error). */
export class S3UploadError extends Error {
  readonly step = "s3_put" as const
  readonly status: number

  constructor(status: number) {
    super(
      "Upload to storage failed. Check your connection and try again, or contact support if this keeps happening."
    )
    this.name = "S3UploadError"
    this.status = status
  }
}

const INGESTION_ERROR_MESSAGES: Record<string, string> = {
  CONVERSATION_NOT_FOUND:
    "This conversation is no longer available. Refresh the page and try again.",
  FORBIDDEN: "You don't have access to this project.",
  UPLOAD_OBJECT_MISSING:
    "The file didn't finish uploading to storage. Try uploading again.",
  UPLOAD_TOO_LARGE: "File must be 25 MB or smaller.",
  UNSUPPORTED_FILE_TYPE:
    "Unsupported file type. Use PDF, Office docs, text, JSON, CSV, ZIP, or images.",
  JOB_ALREADY_APPLIED: "This import was already applied.",
  JOB_NOT_FOUND: "Import job not found. Start a new import.",
}

export function getIngestionErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof S3UploadError) {
    return error.message
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Import cancelled."
  }

  if (error instanceof ApiError) {
    if (error.code) {
      const mapped = INGESTION_ERROR_MESSAGES[error.code]

      if (mapped) {
        return mapped
      }
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function isJobAlreadyAppliedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "JOB_ALREADY_APPLIED" || error.status === 409)
  )
}
