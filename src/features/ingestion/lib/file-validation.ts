export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/webp",
])

export const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "pptx",
  "xlsx",
  "txt",
  "md",
  "json",
  "csv",
  "zip",
  "jpg",
  "jpeg",
  "png",
  "webp",
])

export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string }

function getExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? (parts.at(-1)?.toLowerCase() ?? "") : ""
}

export function validateIngestionFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File must be 25 MB or smaller.",
    }
  }

  const extension = getExtension(file.name)

  if (
    file.type &&
    !ALLOWED_MIME_TYPES.has(file.type) &&
    !ALLOWED_EXTENSIONS.has(extension)
  ) {
    return {
      valid: false,
      error:
        "Unsupported file type. Use PDF, Office docs, text, JSON, CSV, ZIP, or images.",
    }
  }

  if (!file.type && extension && !ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error:
        "Unsupported file extension. Use PDF, Office docs, text, JSON, CSV, ZIP, or images.",
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
