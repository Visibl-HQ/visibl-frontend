"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppLogoBar } from "@/components/layout/app-logo-bar"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import {
  consumeReturnTo,
  redirectToGoogleLogin,
} from "@/features/auth/lib/session"
import { useAuth } from "@/features/auth/components/auth-provider"

export function AuthCallback() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function completeSignIn() {
      try {
        const profile = await refreshUser()

        if (cancelled) {
          return
        }

        if (profile) {
          router.replace(consumeReturnTo("/projects"))
          return
        }

        setError(
          "We could not verify your session. Please try signing in again."
        )
      } catch {
        if (!cancelled) {
          setError("Something went wrong while finishing sign-in.")
        }
      }
    }

    void completeSignIn()

    return () => {
      cancelled = true
    }
  }, [refreshUser, router])

  return (
    <AppShell>
      <AppLogoBar href="/" />
      {error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
          <Button onClick={() => redirectToGoogleLogin("/projects")}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
          <Loader2
            className="text-muted-foreground size-6 animate-spin"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm">Finishing sign-in…</p>
        </div>
      )}
    </AppShell>
  )
}
