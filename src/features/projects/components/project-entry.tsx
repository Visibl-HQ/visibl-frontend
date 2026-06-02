"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { listConversations, resolveProjectBySlug } from "@/lib/api/projects"
import {
  conversationPath,
  draftConversationPath,
} from "@/lib/routing/paths"
import { sortConversationsByRecent } from "@/features/workspace/data/conversation-meta"

type ProjectEntryProps = {
  username: string
  projectSlug: string
}

export function ProjectEntry({ username, projectSlug }: ProjectEntryProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function openProject() {
      try {
        const project = await resolveProjectBySlug(username, projectSlug)
        const page = await listConversations(project.public_id, { limit: 20 })
        const existing = sortConversationsByRecent(page.items)[0]

        if (cancelled) {
          return
        }

        if (existing) {
          router.replace(
            conversationPath(username, projectSlug, existing.public_id)
          )
          return
        }

        router.replace(draftConversationPath(username, projectSlug))
      } catch (entryError) {
        if (!cancelled) {
          setError(
            entryError instanceof Error
              ? entryError.message
              : "Could not open project."
          )
        }
      }
    }

    void openProject()

    return () => {
      cancelled = true
    }
  }, [projectSlug, router, username])

  if (error) {
    return <p className="text-muted-foreground px-4 py-10 text-sm">{error}</p>
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Opening project</span>
    </div>
  )
}
