"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/components/auth-provider"
import { getProject } from "@/lib/api/projects"
import {
  artifactsPath,
  companyMapPath,
  conversationPath,
  projectPathFromProject,
} from "@/lib/routing/paths"
import { slugifyProjectName } from "@/lib/routing/slug"
import { resolveLegacyProjectWorkspaceSection } from "@/features/workspace/lib/workspace-routing"

type LegacyProjectRedirectProps = {
  projectPublicId: string
}

export function LegacyProjectRedirect({
  projectPublicId,
}: LegacyProjectRedirectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    async function redirect() {
      try {
        if (!user?.username) {
          return
        }

        const project = await getProject(projectPublicId)
        const projectSlug = slugifyProjectName(project.name)
        const section = resolveLegacyProjectWorkspaceSection(
          pathname,
          projectPublicId
        )
        const legacyPrefix = `/projects/${projectPublicId}/`
        const suffix = pathname.startsWith(legacyPrefix)
          ? pathname.slice(legacyPrefix.length)
          : ""

        let target = projectPathFromProject(user.username, project)

        if (section === "company-map") {
          target = companyMapPath(user.username, projectSlug)
        } else if (section === "artifacts") {
          target = artifactsPath(user.username, projectSlug)
        } else if (suffix.startsWith("conversations/")) {
          const conversationSegment = suffix
            .slice("conversations/".length)
            .split("/")[0]
          if (conversationSegment) {
            target = conversationPath(
              user.username,
              projectSlug,
              conversationSegment
            )
          }
        } else if (section === "chat" && pathname === `/projects/${projectPublicId}`) {
          target = projectPathFromProject(user.username, project)
        }

        if (!cancelled) {
          router.replace(target)
        }
      } catch (redirectError) {
        if (!cancelled) {
          setError(
            redirectError instanceof Error
              ? redirectError.message
              : "Could not redirect to project."
          )
        }
      }
    }

    void redirect()

    return () => {
      cancelled = true
    }
  }, [pathname, projectPublicId, router, user])

  if (error) {
    return <p className="text-muted-foreground px-4 py-10 text-sm">{error}</p>
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Redirecting to project</span>
    </div>
  )
}
