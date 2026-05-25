"use client"

import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/components/auth-provider"

type GoogleSignInButtonProps = {
  returnTo?: string
  className?: string
}

export function GoogleSignInButton({
  returnTo,
  className,
}: GoogleSignInButtonProps) {
  const { signIn } = useAuth()

  return (
    <Button
      type="button"
      className={className}
      onClick={() => signIn(returnTo)}
    >
      <LogIn className="size-4" aria-hidden="true" />
      Continue with Google
    </Button>
  )
}
