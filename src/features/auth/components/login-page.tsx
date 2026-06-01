"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppLogoBar } from "@/components/layout/app-logo-bar"
import { AppPanel } from "@/components/marketing/app-panel"
import { AppShell } from "@/components/layout/app-shell"
import { SkipLink } from "@/components/layout/skip-link"
import { SectionLabel } from "@/components/marketing/section-label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { typography } from "@/config/tokens"
import { cn } from "@/lib/utils"
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button"
import { useAuth } from "@/features/auth/components/auth-provider"

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()
  const accountCreated = searchParams.get("account") === "created"

  useEffect(() => {
    if (!accountCreated && !isLoading && isAuthenticated) {
      router.replace("/projects")
    }
  }, [accountCreated, isAuthenticated, isLoading, router])

  return (
    <AppShell>
      <SkipLink href="#login-main" />
      <AppLogoBar
        href="/"
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/">Back to home</Link>
          </Button>
        }
      />

      <main
        id="login-main"
        className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16"
      >
        <div className="w-full max-w-md">
          {isLoading ? (
            <AppPanel aria-busy="true" aria-label="Checking session">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-48" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-8 h-11 w-full" />
            </AppPanel>
          ) : (
            <AppPanel className="text-center">
              <SectionLabel index="00">Sign in</SectionLabel>
              <h1 className={cn(typography.h2, "mt-3 text-2xl sm:text-3xl")}>
                Welcome back
              </h1>
              {accountCreated ? (
                <p className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-950 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                  Account created. Sign in to open your workspace.
                </p>
              ) : null}
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                Continue with Google to open your projects, conversations, and
                workspace.
              </p>
              <div className="mt-8">
                <GoogleSignInButton
                  returnTo="/projects"
                  className="h-11 w-full rounded-md font-medium tracking-wide uppercase"
                />
              </div>
              <p className="text-muted-foreground mt-6 text-xs leading-5">
                New here?{" "}
                <Link
                  href="/signup"
                  className="text-foreground underline underline-offset-4"
                >
                  Create an account
                </Link>
                .
              </p>
            </AppPanel>
          )}
        </div>
      </main>
    </AppShell>
  )
}
