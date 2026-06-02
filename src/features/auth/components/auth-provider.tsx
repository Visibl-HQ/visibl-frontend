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
const PUBLIC_AUTH_PATHS = new Set(["/", "/login", "/signup", "/auth/callback"])
const PUBLIC_SESSION_REDIRECT_PATHS = new Set(["/", "/login"])

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublicPath = PUBLIC_AUTH_PATHS.has(pathname)
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

    if (isPublicPath) {
      if (!PUBLIC_SESSION_REDIRECT_PATHS.has(pathname)) {
        return () => {
          cancelled = true
        }
      }

      async function loadPublicSession() {
        try {
          const profile = await refreshUser()

          if (
            !cancelled &&
            profile &&
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

      void loadPublicSession()

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
  }, [isPublicPath, pathname, refreshUser, router])

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
      isLoading: isPublicPath ? false : isLoading,
      isAuthenticated: Boolean(user),
      refreshUser,
      logout,
      signIn,
    }),
    [user, isPublicPath, isLoading, refreshUser, logout, signIn]
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
