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
import { redirectToGoogleLogin } from "@/features/auth/lib/session"

type AuthContextValue = {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<UserProfile | null>
  logout: () => Promise<void>
  signIn: (returnTo?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Marketing-only routes skip /me on first paint to avoid blocking the landing page. */
const MARKETING_PATHS = new Set(["/"])

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const skipSessionBootstrap = MARKETING_PATHS.has(pathname)
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

    if (skipSessionBootstrap) {
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
  }, [skipSessionBootstrap, pathname, refreshUser])

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
      isLoading: skipSessionBootstrap ? false : isLoading,
      isAuthenticated: Boolean(user),
      refreshUser,
      logout,
      signIn,
    }),
    [user, skipSessionBootstrap, isLoading, refreshUser, logout, signIn]
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
