"use client"

import Link from "next/link"
import { AppLogoBar } from "@/components/layout/app-logo-bar"
import { AppPanel } from "@/components/marketing/app-panel"
import { AppShell } from "@/components/layout/app-shell"
import { SkipLink } from "@/components/layout/skip-link"
import { SectionLabel } from "@/components/marketing/section-label"
import { Button } from "@/components/ui/button"
import { typography } from "@/config/tokens"
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button"
import { cn } from "@/lib/utils"

export function SignupPage() {
  return (
    <AppShell>
      <SkipLink href="#signup-main" />
      <AppLogoBar
        href="/"
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/login">Log in</Link>
          </Button>
        }
      />

      <main
        id="signup-main"
        className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16"
      >
        <div className="w-full max-w-md">
          <AppPanel className="text-center">
            <SectionLabel index="00">Sign up</SectionLabel>
            <h1 className={cn(typography.h2, "mt-3 text-2xl sm:text-3xl")}>
              Create your account
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              Use Google to create your Visibl account. After signup, you will
              return to login before opening your projects.
            </p>
            <div className="mt-8">
              <GoogleSignInButton
                returnTo="/login?account=created"
                className="h-11 w-full rounded-md font-medium tracking-wide uppercase"
              >
                Create account with Google
              </GoogleSignInButton>
            </div>
            <p className="text-muted-foreground mt-6 text-xs leading-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-foreground underline underline-offset-4"
              >
                Log in
              </Link>
              .
            </p>
          </AppPanel>
        </div>
      </main>
    </AppShell>
  )
}
