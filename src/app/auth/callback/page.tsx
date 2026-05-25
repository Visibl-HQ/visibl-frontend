import type { Metadata } from "next"
import { AuthCallback } from "@/features/auth/components/auth-callback"

export const metadata: Metadata = {
  title: "Signing in",
}

export default function Page() {
  return <AuthCallback />
}
