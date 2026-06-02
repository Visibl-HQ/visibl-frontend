"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { resolveProjectBySlug } from "@/lib/api/projects"
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell"
import { WorkspaceLayoutSkeleton } from "@/features/workspace/components/workspace-skeletons"

type WorkspaceProjectGateProps = {
  username: string
  projectSlug: string
}

export function WorkspaceProjectGate({
  username,
  projectSlug,
}: WorkspaceProjectGateProps) {
  const [projectPublicId, setProjectPublicId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveProject() {
      setError(null)

      try {
        const project = await resolveProjectBySlug(username, projectSlug)

        if (!cancelled) {
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
  }, [projectSlug, username])

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
