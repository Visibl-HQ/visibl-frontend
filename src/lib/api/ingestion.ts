import { apiFetch, apiJson } from "@/lib/api/client"
import { S3UploadError } from "@/features/ingestion/lib/ingestion-errors"
import type {
  ApplyIngestionResponse,
  CreateSourceItemBody,
  EnqueueJobResponse,
  ExtractionJobRead,
  ImportPromptResponse,
  ParseExportResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from "@/lib/api/types"

function ingestionPath(projectPublicId: string, suffix = ""): string {
  return `/projects/${projectPublicId}/ingestion${suffix}`
}

export async function createUploadUrl(
  projectPublicId: string,
  body: UploadUrlRequest
): Promise<UploadUrlResponse> {
  return apiJson<UploadUrlResponse>(
    ingestionPath(projectPublicId, "/upload-url"),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}

/** @alias createUploadUrl */
export const requestUploadUrl = createUploadUrl

export async function createSourceItem(
  projectPublicId: string,
  body: CreateSourceItemBody
): Promise<EnqueueJobResponse> {
  return apiJson<EnqueueJobResponse>(
    ingestionPath(projectPublicId, "/source-items"),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}

export async function getExtractionJob(
  projectPublicId: string,
  jobPublicId: string
): Promise<ExtractionJobRead> {
  return apiJson<ExtractionJobRead>(
    ingestionPath(projectPublicId, `/jobs/${jobPublicId}`)
  )
}

export async function applyIngestion(
  projectPublicId: string,
  jobPublicId: string
): Promise<ApplyIngestionResponse> {
  return apiJson<ApplyIngestionResponse>(
    ingestionPath(projectPublicId, `/jobs/${jobPublicId}/apply`),
    { method: "POST" }
  )
}

/** @alias applyIngestion */
export const applyIngestionJob = applyIngestion

export async function parseExport(
  projectPublicId: string,
  file: File
): Promise<ParseExportResponse> {
  const formData = new FormData()
  formData.append("file", file)

  return apiJson<ParseExportResponse>(
    ingestionPath(projectPublicId, "/parse-export"),
    {
      method: "POST",
      body: formData,
    },
    { retryOnUnauthorized: true }
  )
}

export async function getImportPrompt(
  projectPublicId: string,
  provider: string
): Promise<ImportPromptResponse> {
  return apiJson<ImportPromptResponse>(
    ingestionPath(projectPublicId, `/import-prompts/${provider}`)
  )
}

/** @alias getImportPrompt */
export const getImportPrompts = getImportPrompt

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    credentials: "omit",
    ...(signal ? { signal } : {}),
  })

  if (!response.ok) {
    throw new S3UploadError(response.status)
  }
}

export { apiFetch, apiJson }
