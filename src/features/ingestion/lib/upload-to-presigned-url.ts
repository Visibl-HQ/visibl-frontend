import { uploadFileToPresignedUrl } from "@/lib/api/ingestion"

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<void> {
  await uploadFileToPresignedUrl(uploadUrl, file, signal)
}
