"use client"

import { useRef } from "react"
import {
  ArrowRight,
  Ban,
  Clock3,
  FileText,
  Layers3,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ArtifactHubRead, ArtifactRead } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { ReadinessBadge } from "@/features/workspace/components/readiness-labels"

type ArtifactHubPanelProps = {
  artifactHub: ArtifactHubRead
  selectedArtifactId: string | null
  onSelectArtifact: (artifact: ArtifactRead) => void
}

export function ArtifactHubPanel({
  artifactHub,
  selectedArtifactId,
  onSelectArtifact,
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
          artifact={selectedArtifact}
          className="order-first lg:order-none"
          detailRef={detailRef}
        />
      </div>
    </section>
  )
}

function ArtifactDetailPanel({
  artifact,
  className,
  detailRef,
}: {
  artifact: ArtifactRead | null
  className?: string
  detailRef: React.Ref<HTMLElement>
}) {
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
          <div className="flex items-center gap-2">
            <FileText
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">Preview placeholder</p>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Draft preview appears here after generation is added. Current state
            only proves readiness and source coverage.
          </p>
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
        </div>

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
            Generation/export disabled
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
