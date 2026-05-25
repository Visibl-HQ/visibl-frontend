import { apiJson } from "@/lib/api/client"
import type { RefreshResponse, UserProfile } from "@/lib/api/types"

export async function getCurrentUser(): Promise<UserProfile> {
  return apiJson<UserProfile>("/auth/me")
}

export async function refreshSession(): Promise<RefreshResponse> {
  return apiJson<RefreshResponse>(
    "/auth/refresh",
    { method: "POST" },
    { retryOnUnauthorized: false }
  )
}

export async function logout(): Promise<void> {
  await apiJson<void>(
    "/auth/logout",
    { method: "POST" },
    { retryOnUnauthorized: false }
  )
}
