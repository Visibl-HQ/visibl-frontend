"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { resolveProjectBySlug } from "@/lib/api/projects"
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell"
import { WorkspaceLayoutSkeleton } from "@/features/workspace/components/workspace-skeletons"
import { getOrCreateRequest } from "@/features/workspace/lib/workspace-request-cache"
import { measureWorkspaceTiming } from "@/features/workspace/lib/workspace-timing"

type WorkspaceProjectGateProps = {
  username: string
  projectSlug: string
}

function slugCacheKey(username: string, projectSlug: string): string {
  return `${username}/${projectSlug}`
}

export function WorkspaceProjectGate({
  username,
  projectSlug,
}: WorkspaceProjectGateProps) {
  const cacheKey = slugCacheKey(username, projectSlug)
  const [projectPublicId, setProjectPublicId] = useState<string | null>(() => {
    const cached = sessionStorage.getItem(`visibl:slug:${cacheKey}`)
    return cached || null
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveProject() {
      setError(null)

      try {
        const project = await measureWorkspaceTiming(
          "slug resolve",
          () =>
            getOrCreateRequest(`slug:${cacheKey}`, () =>
              resolveProjectBySlug(username, projectSlug)
            ),
          cacheKey
        )

        if (!cancelled) {
          sessionStorage.setItem(`visibl:slug:${cacheKey}`, project.public_id)
          setProjectPublicId(project.public_id)
        }
      } catch (resolveError) {
        if (!cancelled) {
          setError(
            resolveError instanceof Error
              ? resolveError.message
              : "Project not found."
          )
        }
      }
    }

    void resolveProject()

    return () => {
      cancelled = true
    }
  }, [cacheKey, projectSlug, username])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        <Button asChild variant="outline">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    )
  }

  if (!projectPublicId) {
    return <WorkspaceLayoutSkeleton />
  }

  return (
    <WorkspaceShell
      projectPublicId={projectPublicId}
      username={username}
      projectSlug={projectSlug}
    />
  )
}
