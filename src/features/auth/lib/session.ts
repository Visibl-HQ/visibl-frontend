import { getGoogleLoginUrl } from "@/lib/api/client"

export const RETURN_TO_KEY = "visibl:returnTo"

function normalizeReturnTo(
  path: string | null,
  fallback = "/projects"
): string {
  if (!path) {
    return fallback
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback
  }

  return path
}

export function storeReturnTo(path: string): void {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(RETURN_TO_KEY, normalizeReturnTo(path))
}

export function consumeReturnTo(fallback = "/projects"): string {
  if (typeof window === "undefined") {
    return fallback
  }

  const value = sessionStorage.getItem(RETURN_TO_KEY)
  sessionStorage.removeItem(RETURN_TO_KEY)
  return normalizeReturnTo(value, fallback)
}

export function redirectToGoogleLogin(returnTo?: string): void {
  if (returnTo) {
    storeReturnTo(returnTo)
  }

  window.location.href = getGoogleLoginUrl()
}
