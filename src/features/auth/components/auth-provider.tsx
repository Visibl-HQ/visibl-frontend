"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { ApiError } from "@/lib/api/client"
import { getCurrentUser, logout as logoutRequest } from "@/lib/api/auth"
import type { UserProfile } from "@/lib/api/types"
import {
  consumeReturnTo,
  redirectToGoogleLogin,
} from "@/features/auth/lib/session"

type AuthContextValue = {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<UserProfile | null>
  logout: () => Promise<void>
  signIn: (returnTo?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Marketing-only routes skip blocking /me on first paint. */
const MARKETING_PATHS = new Set(["/"])
const PUBLIC_SESSION_REDIRECT_PATHS = new Set(["/", "/login"])
const PUBLIC_STATIC_PATHS = new Set(["/signup", "/auth/callback"])

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const skipBlockingBootstrap =
    MARKETING_PATHS.has(pathname) || PUBLIC_STATIC_PATHS.has(pathname)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getCurrentUser()
      setUser(profile)
      return profile
    } catch (error) {
      setUser(null)

      if (error instanceof ApiError && error.status === 401) {
        return null
      }

      throw error
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (PUBLIC_STATIC_PATHS.has(pathname)) {
      setIsLoading(false)
      return () => {
        cancelled = true
      }
    }

    async function resolveSession(options: { redirectIfAuthed: boolean }) {
      try {
        const profile = await refreshUser()

        if (
          !cancelled &&
          profile &&
          options.redirectIfAuthed &&
          PUBLIC_SESSION_REDIRECT_PATHS.has(pathname)
        ) {
          router.replace(consumeReturnTo("/projects"))
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    if (MARKETING_PATHS.has(pathname)) {
      setIsLoading(false)
      void resolveSession({ redirectIfAuthed: true })
      return () => {
        cancelled = true
      }
    }

    if (PUBLIC_SESSION_REDIRECT_PATHS.has(pathname)) {
      void resolveSession({ redirectIfAuthed: true })
      return () => {
        cancelled = true
      }
    }

    async function loadUser() {
      try {
        setIsLoading(true)
        await refreshUser()
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [pathname, refreshUser, router])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      router.replace("/login")
    }
  }, [router])

  const signIn = useCallback((returnTo?: string) => {
    redirectToGoogleLogin(returnTo)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: skipBlockingBootstrap ? false : isLoading,
      isAuthenticated: Boolean(user),
      refreshUser,
      logout,
      signIn,
    }),
    [user, skipBlockingBootstrap, isLoading, refreshUser, logout, signIn]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}