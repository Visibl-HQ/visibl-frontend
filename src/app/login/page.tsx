import { Suspense } from "react"
import type { Metadata } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginPage } from "@/features/auth/components/login-page"

export const metadata: Metadata = {
  title: "Sign in",
}

function LoginPageFallback() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center px-4"
      aria-busy="true"
      aria-label="Loading sign in"
    >
      <Skeleton className="h-64 w-full max-w-md rounded-lg" />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPage />
    </Suspense>
  )
}
