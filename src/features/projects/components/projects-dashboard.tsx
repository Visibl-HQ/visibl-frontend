"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, FolderKanban } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { AppShell } from "@/components/layout/app-shell"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/marketing/empty-state"
import { SectionLabel } from "@/components/marketing/section-label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { typography } from "@/config/tokens"
import { cn } from "@/lib/utils"
import { NewProjectDialog } from "@/features/projects/components/new-project-dialog"
import { ProjectCard } from "@/features/projects/components/project-card"
import { UserMenu } from "@/features/projects/components/user-menu"
import { createProject, listProjects } from "@/lib/api/projects"
import { draftConversationPath } from "@/features/workspace/lib/conversation-routing"
import type { ProjectSummaryRead } from "@/lib/api/types"

export function ProjectsDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectSummaryRead[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async (cursor?: string | null) => {
    const page = await listProjects({ limit: 20, cursor: cursor ?? null })
    return page
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const page = await loadProjects()

        if (!cancelled) {
          setProjects(page.items)
          setNextCursor(page.next_cursor)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load projects."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [loadProjects])

  async function handleCreateProject(name: string) {
    const project = await createProject({ name })
    router.push(draftConversationPath(project.id))
  }

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)

    try {
      const page = await loadProjects(nextCursor)
      setProjects((current) => [...current, ...page.items])
      setNextCursor(page.next_cursor)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load more projects."
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <AppShell>
      <AppHeader index="01" label="Projects" actions={<UserMenu />} />

      <Container className="py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionLabel index="01">Dashboard</SectionLabel>
            <h1 className={cn(typography.h2, "mt-2")}>Your projects</h1>
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              Open a project workspace to chat, capture memory pins, and build
              your problem and customer doc.
            </p>
          </div>
          <NewProjectDialog onCreate={handleCreateProject} />
        </div>

        {error ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 mb-6 rounded-lg border px-4 py-3 text-sm"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create a project to start an intake conversation, capture memory pins, and build your problem and customer doc."
            action={<NewProjectDialog onCreate={handleCreateProject} />}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  href={`/projects/${project.id}`}
                />
              ))}
            </div>
            {nextCursor ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-md"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Container>
    </AppShell>
  )
}
