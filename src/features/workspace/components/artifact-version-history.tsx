"use client"

/**
 * Collapsed-by-default version history (the current draft leads; history is
 * secondary at pre-seed). Bounded scroll, lazy-loaded on expand.
 */

import { useCallback, useState } from "react"
import { ChevronDown, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listArtifactVersions } from "@/lib/api/projects"
import type { ArtifactVersionRead } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(delta / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function ArtifactVersionHistory({
  projectId,
  artifactId,
  selectedVersionId,
  onSelectVersion,
  refreshToken,
}: {
  projectId: string
  artifactId: string
  selectedVersionId: string | null
  onSelectVersion: (version: ArtifactVersionRead) => void
  /** Bump to invalidate the loaded list (e.g. after a new generation). */
  refreshToken: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [versions, setVersions] = useState<ArtifactVersionRead[] | null>(null)
  const [loadedToken, setLoadedToken] = useState<number>(-1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const page = await listArtifactVersions(projectId, artifactId, {
        limit: 20,
      })
      setVersions(page.items)
      setLoadedToken(refreshToken)
    } catch {
      setError("Could not load draft history.")
    } finally {
      setIsLoading(false)
    }
  }, [artifactId, projectId, refreshToken])

  const toggle = useCallback(() => {
    setExpanded((value) => {
      const next = !value
      if (next && (versions === null || loadedToken !== refreshToken)) {
        void load()
      }
      return next
    })
  }, [load, loadedToken, refreshToken, versions])

  return (
    <div className="border-border/70 mt-3 border-t pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-xs"
        onClick={toggle}
        aria-expanded={expanded}
      >
        <History className="size-3.5" aria-hidden="true" />
        Previous drafts
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>

      {expanded ? (
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-muted-foreground px-2 text-xs">Loading…</p>
          ) : error ? (
            <p className="text-muted-foreground px-2 text-xs">{error}</p>
          ) : versions && versions.length > 0 ? (
            versions.map((version) => (
              <button
                key={version.public_id}
                type="button"
                onClick={() => onSelectVersion(version)}
                className={cn(
                  "border-border/60 flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs",
                  "hover:bg-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  selectedVersionId === version.public_id &&
                    "border-brand/60 bg-background"
                )}
              >
                <span className="font-medium">
                  Version {version.version_number}
                </span>
                <span className="flex items-center gap-1.5">
                  {version.is_stale ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 px-1.5 text-[10px] text-amber-800 dark:border-amber-900 dark:text-amber-200"
                    >
                      Stale
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground">
                    {relativeTime(version.created_at)}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground px-2 text-xs">
              No internal drafts yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
