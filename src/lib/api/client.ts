import { env } from "@/config/env"
import type { ApiErrorBody } from "@/lib/api/types"

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(
    status: number,
    message: string,
    body: ApiErrorBody | null = null
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
}

export function getApiV1Url(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getApiBaseUrl()}/api/v1${normalizedPath}`
}

export function getGoogleLoginUrl(): string {
  return getApiV1Url("/auth/google/login")
}

async function parseErrorBody(
  response: Response
): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody
  } catch {
    return null
  }
}

function formatErrorMessage(
  body: ApiErrorBody | null,
  fallback: string
): string {
  if (!body) {
    return fallback
  }

  if (typeof body.detail === "string") {
    return body.detail
  }

  if (Array.isArray(body.detail) && body.detail.length > 0) {
    return body.detail.map((item) => item.msg).join(", ")
  }

  return fallback
}

async function refreshSession(): Promise<boolean> {
  const response = await fetch(getApiV1Url("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  })

  return response.ok
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
  options?: { retryOnUnauthorized?: boolean }
): Promise<Response> {
  const retryOnUnauthorized = options?.retryOnUnauthorized ?? true
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let response = await fetch(getApiV1Url(path), {
    ...init,
    credentials: "include",
    headers,
  })

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshed = await refreshSession()

    if (refreshed) {
      response = await fetch(getApiV1Url(path), {
        ...init,
        credentials: "include",
        headers,
      })
    }
  }

  return response
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  options?: { retryOnUnauthorized?: boolean }
): Promise<T> {
  const response = await apiFetch(path, init, options)

  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ApiError(
      response.status,
      formatErrorMessage(body, `Request failed with status ${response.status}`),
      body
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
