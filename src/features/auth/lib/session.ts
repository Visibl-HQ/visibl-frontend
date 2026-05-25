import { getGoogleLoginUrl } from "@/lib/api/client"

export const RETURN_TO_KEY = "visibl:returnTo"

export function storeReturnTo(path: string): void {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(RETURN_TO_KEY, path)
}

export function consumeReturnTo(fallback = "/projects"): string {
  if (typeof window === "undefined") {
    return fallback
  }

  const value = sessionStorage.getItem(RETURN_TO_KEY)
  sessionStorage.removeItem(RETURN_TO_KEY)
  return value ?? fallback
}

export function redirectToGoogleLogin(returnTo?: string): void {
  if (returnTo) {
    storeReturnTo(returnTo)
  }

  window.location.href = getGoogleLoginUrl()
}
