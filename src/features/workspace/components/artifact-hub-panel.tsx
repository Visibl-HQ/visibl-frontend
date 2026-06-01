"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  Ban,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  Plus,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createArtifactVersion, listArtifactVersions } from "@/lib/api/projects"
import type {
  ArtifactHubRead,
  ArtifactRead,
  ArtifactVersionRead,
} from "@/lib/api/types"
import { formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ReadinessBadge } from "@/features/workspace/components/readiness-labels"

type ArtifactHubPanelProps = {
  artifactHub: ArtifactHubRead
  selectedArtifactId: string | null
  onSelectArtifact: (artifact: ArtifactRead) => void
  onArtifactVersionCreated?: (() => void | Promise<void>) | undefined
}

export function ArtifactHubPanel({
  artifactHub,
  selectedArtifactId,
  onSelectArtifact,
  onArtifactVersionCreated,
}: ArtifactHubPanelProps) {
  const detailRef = useRef<HTMLElement | null>(null)
  const selectedArtifact =
    artifactHub.artifacts.find(
      (artifact) => artifact.id === selectedArtifactId
    ) ??
    artifactHub.artifacts[0] ??
    null

  function selectArtifactAndRevealDetail(artifact: ArtifactRead) {
    onSelectArtifact(artifact)
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      })
    })
  }

  return (
    <section
      data-testid="artifact-hub"
      className="bg-background flex min-h-0 flex-1 flex-col"
      aria-labelledby="artifact-hub-title"
    >
      <div className="border-border/70 shrink-0 border-b px-4 py-4 sm:px-6">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Artifact Hub
        </p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="artifact-hub-title" className="text-xl font-semibold">
              Investor artifact readiness
            </h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Every artifact shows its gate, source strength, blockers, stale
              state, last version, and the action that improves it next.
            </p>
          </div>
          <div className="text-muted-foreground text-xs">
            {artifactHub.artifacts.length} required artifacts
          </div>
        </div>
      </div>

      <div
        data-lenis-prevent
        className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="order-last grid content-start gap-3 p-4 sm:p-6 lg:order-none xl:grid-cols-2">
          {artifactHub.artifacts.map((artifact) => (
            <article
              key={artifact.id}
              className={cn(
                "border-border/80 bg-surface-elevated/70 rounded-lg border p-4 transition-colors",
                selectedArtifact?.id === artifact.id && "border-brand/70"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{artifact.name}</h3>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {artifact.description}
                  </p>
                </div>
                <ReadinessBadge
                  readiness={artifact.readiness}
                  className="shrink-0"
                />
              </div>

              <dl className="border-border/70 mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Source strength</dt>
                  <dd className="mt-1 font-medium">
                    {artifact.source_strength.label}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Blockers</dt>
                  <dd className="mt-1 font-medium">{artifact.blocker_count}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Stale status</dt>
                  <dd className="mt-1 flex items-center gap-1 font-medium">
                    {artifact.stale_status.is_stale ? (
                      <Clock3
                        className="size-3.5 text-amber-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    {artifact.stale_status.label}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="mt-1 font-medium">
                    {artifact.version_state?.label ?? "No version"}
                  </dd>
                </div>
              </dl>

              <div className="border-border/70 mt-4 border-t pt-3">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  Next action
                </p>
                <p className="mt-1 text-xs">
                  {artifact.next_best_action.label}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 w-full justify-between"
                onClick={() => selectArtifactAndRevealDetail(artifact)}
                aria-pressed={selectedArtifact?.id === artifact.id}
              >
                Open detail
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </article>
          ))}
        </div>

        <ArtifactDetailPanel
          projectId={artifactHub.project_id}
          artifact={selectedArtifact}
          className="order-first lg:order-none"
          detailRef={detailRef}
          onArtifactVersionCreated={onArtifactVersionCreated}
        />
      </div>
    </section>
  )
}

function ArtifactDetailPanel({
  projectId,
  artifact,
  className,
  detailRef,
  onArtifactVersionCreated,
}: {
  projectId: string
  artifact: ArtifactRead | null
  className?: string
  detailRef: React.Ref<HTMLElement>
  onArtifactVersionCreated?: (() => void | Promise<void>) | undefined
}) {
  const [versions, setVersions] = useState<ArtifactVersionRead[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  )
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [versionError, setVersionError] = useState<string | null>(null)

  useEffect(() => {
    if (!artifact) {
      return
    }

    let cancelled = false
    void listArtifactVersions(projectId, artifact.id)
      .then((items) => {
        if (cancelled) {
          return
        }
        setVersionError(null)
        setVersions(items)
        setSelectedVersionId((current) => {
          if (current && items.some((item) => item.id === current)) {
            return current
          }
          return artifact.current_version?.id ?? items[0]?.id ?? null
        })
      })
      .catch((error) => {
        if (!cancelled) {
          setVersionError(
            error instanceof Error
              ? error.message
              : "Could not load artifact versions."
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [artifact, projectId])

  if (!artifact) {
    return (
      <aside
        ref={detailRef}
        className={cn(
          "border-border/70 bg-surface border-t p-4 lg:border-t-0 lg:border-l",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">
          Select an artifact to inspect readiness.
        </p>
      </aside>
    )
  }

  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ??
    artifact.current_version ??
    versions[0] ??
    null

  async function handleCreateVersion() {
    if (!artifact || !artifact.can_create_version) {
      return
    }

    setIsCreatingVersion(true)
    setVersionError(null)
    try {
      const created = await createArtifactVersion(projectId, artifact.id)
      const nextVersions = await listArtifactVersions(projectId, artifact.id)
      setVersions(nextVersions)
      setSelectedVersionId(created.id)
      await onArtifactVersionCreated?.()
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Could not create internal version."
      )
    } finally {
      setIsCreatingVersion(false)
    }
  }

  return (
    <aside
      ref={detailRef}
      data-testid="artifact-detail"
      className={cn(
        "border-border/70 bg-surface border-t lg:min-h-0 lg:border-t-0 lg:border-l",
        className
      )}
      aria-labelledby="artifact-detail-title"
    >
      <div className="border-border/70 border-b p-4">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Artifact Detail
        </p>
        <h3 id="artifact-detail-title" className="mt-1 font-semibold">
          {artifact.name}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {artifact.description}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="border-border/70 bg-background rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">
                  {selectedVersion
                    ? selectedVersion.content.title
                    : "No internal version yet"}
                </p>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {selectedVersion
                  ? selectedVersion.content.summary
                  : (artifact.create_version_disabled_reason ??
                    "Create an internal draft version from the current Company Map source snapshot.")}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!artifact.can_create_version || isCreatingVersion}
              onClick={handleCreateVersion}
              title={artifact.create_version_disabled_reason ?? undefined}
            >
              {isCreatingVersion ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-3.5" aria-hidden="true" />
              )}
              Create internal version
            </Button>
          </div>
          {versionError ? (
            <p className="text-destructive mt-3 text-xs">{versionError}</p>
          ) : null}
          {selectedVersion ? (
            <VersionPreview version={selectedVersion} />
          ) : null}
        </div>

        <div className="grid gap-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Readiness</span>
            <ReadinessBadge readiness={artifact.readiness} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Sources</span>
            <span className="font-medium">
              {artifact.source_strength.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">
              {artifact.version_state?.label ?? "No version"}
            </span>
          </div>
          {selectedVersion ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Source snapshot</span>
                <span className="max-w-[12rem] truncate font-medium">
                  {selectedVersion.source_snapshot_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {formatRelativeDate(selectedVersion.created_at)}
                </span>
              </div>
              {selectedVersion.is_stale ? (
                <p className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-200">
                  {selectedVersion.stale_reason ??
                    "This version is stale because source state changed."}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="size-4" aria-hidden="true" />
            Version history
          </h4>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {versions.length > 0 ? (
              versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  className={cn(
                    "border-border/70 bg-background hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left text-xs transition-colors",
                    selectedVersion?.id === version.id && "border-brand/70"
                  )}
                  onClick={() => setSelectedVersionId(version.id)}
                >
                  <span className="font-medium">
                    Version {version.version_number}
                  </span>
                  <span
                    className={cn(
                      "text-muted-foreground",
                      version.is_stale && "text-amber-700 dark:text-amber-200"
                    )}
                  >
                    {version.is_stale ? "Stale" : "Current"} -{" "}
                    {formatRelativeDate(version.created_at)}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">
                No versions have been created for this artifact.
              </p>
            )}
          </div>
        </section>

        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Blockers
          </h4>
          <div className="mt-2 space-y-2">
            {artifact.blockers.length > 0 ? (
              artifact.blockers.map((blocker) => (
                <div
                  key={blocker.id}
                  className="border-border/70 bg-background rounded-md border p-3"
                >
                  <p className="text-xs font-medium">{blocker.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {blocker.next_action.label}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">
                No blockers remain in this read model.
              </p>
            )}
          </div>
        </section>

        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Layers3 className="size-4" aria-hidden="true" />
            Evidence
          </h4>
          <div className="mt-2 space-y-2">
            {artifact.evidence.length > 0 ? (
              artifact.evidence.slice(0, 4).map((evidence) => (
                <div
                  key={evidence.id}
                  className="border-border/70 bg-background rounded-md border p-3"
                >
                  <p className="text-xs font-medium">{evidence.label}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                    {evidence.detail}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">
                No evidence has been attached yet.
              </p>
            )}
          </div>
        </section>

        <div className="border-border/70 bg-background rounded-lg border p-3">
          <p className="flex items-center gap-2 text-xs font-medium">
            <Ban className="size-3.5" aria-hidden="true" />
            Version/export status
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {artifact.generation_disabled_reason}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {artifact.export_disabled_reason}
          </p>
        </div>
      </div>
    </aside>
  )
}

function VersionPreview({ version }: { version: ArtifactVersionRead }) {
  return (
    <div className="mt-4 space-y-3">
      {version.content.caveats.length > 0 ? (
        <div className="rounded-md bg-amber-500/10 p-3">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-100">
            Caveats
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-100">
            {version.content.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {version.content.sections.map((section) => (
          <section
            key={section.id}
            className="border-border/70 rounded-md border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h5 className="text-xs font-semibold">{section.label}</h5>
              <span className="text-muted-foreground text-[11px]">
                {section.support_label}
              </span>
            </div>
            <p className="mt-2 text-xs">{section.value}</p>
            {section.source_refs.length > 0 ? (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px]">
                Source:{" "}
                {section.source_refs.map((source) => source.label).join(", ")}
              </p>
            ) : null}
            {section.caveats.length > 0 ? (
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-200">
                {section.caveats[0]}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}
