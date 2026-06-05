"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { narrativeLabelAt } from "@/features/workspace/lib/generation-events"
import {
  ArrowRight,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArtifactDeckPreview } from "@/features/workspace/components/artifact-deck-preview"
import { ArtifactVersionHistory } from "@/features/workspace/components/artifact-version-history"
import { ArtifactVersionPreview } from "@/features/workspace/components/artifact-version-preview"
import { ReadinessBadge } from "@/features/workspace/components/readiness-labels"
import {
  useArtifactGeneration,
  type GenerationState,
} from "@/features/workspace/hooks/use-artifact-generation"
import type {
  ArtifactHubRead,
  ArtifactRead,
  ArtifactVersionRead,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

type ArtifactHubPanelProps = {
  artifactHub: ArtifactHubRead
  selectedArtifactId: string | null
  onSelectArtifact: (artifact: ArtifactRead) => void
  projectId: string
  onGenerationComplete?: (() => void | Promise<void>) | undefined
  onAskInChat?: ((question: string) => void) | undefined
}

const IN_FLIGHT_PHASES = new Set(["starting", "queued", "running"])

export function ArtifactHubPanel({
  artifactHub,
  selectedArtifactId,
  onSelectArtifact,
  projectId,
  onGenerationComplete,
  onAskInChat,
}: ArtifactHubPanelProps) {
  const detailRef = useRef<HTMLElement | null>(null)
  const selectedArtifact =
    artifactHub.artifacts.find(
      (artifact) => artifact.id === selectedArtifactId
    ) ??
    artifactHub.artifacts[0] ??
    null

  const [versionRefreshToken, setVersionRefreshToken] = useState(0)
  const generation = useArtifactGeneration({
    projectId,
    onGenerationComplete: async () => {
      setVersionRefreshToken((token) => token + 1)
      await onGenerationComplete?.()
    },
  })

  // Re-attach to jobs started before navigation (resume is a no-op without a
  // remembered job id).
  useEffect(() => {
    if (selectedArtifact) {
      generation.resume(selectedArtifact.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume identity changes per render; keyed on selection only
  }, [selectedArtifact?.id])

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
        className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_400px]"
      >
        <div className="order-last grid content-start gap-3 p-4 sm:p-6 lg:order-none xl:grid-cols-2">
          {artifactHub.artifacts.map((artifact) => {
            const cardGeneration = generation.stateFor(artifact.id)
            const isDrafting = IN_FLIGHT_PHASES.has(cardGeneration.phase)
            return (
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ReadinessBadge readiness={artifact.readiness} />
                    {isDrafting ? (
                      <span className="text-brand inline-flex items-center gap-1 text-[11px] font-medium">
                        <Loader2
                          className="size-3 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        Drafting…
                      </span>
                    ) : null}
                  </div>
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
                    <dd className="mt-1 font-medium">
                      {artifact.blocker_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Stale status</dt>
                    <dd className="mt-1 font-medium">
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
                    {artifact.can_create_version && !artifact.current_version
                      ? "Generate your first source-backed draft."
                      : artifact.next_best_action.label}
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
            )
          })}
        </div>

        <ArtifactDetailPanel
          key={selectedArtifact?.id ?? "empty"}
          artifact={selectedArtifact}
          projectId={projectId}
          generationState={
            selectedArtifact ? generation.stateFor(selectedArtifact.id) : null
          }
          onGenerate={() => {
            if (selectedArtifact) {
              void generation.generate(selectedArtifact.id)
            }
          }}
          onRecheck={() => {
            if (selectedArtifact) {
              generation.recheck(selectedArtifact.id)
            }
          }}
          onAskInChat={onAskInChat}
          versionRefreshToken={versionRefreshToken}
          className="order-first lg:order-none"
          detailRef={detailRef}
        />
      </div>
    </section>
  )
}

function UnlockMeter({ artifact }: { artifact: ArtifactRead }) {
  if (artifact.minimum_draft_field_keys.length === 0) {
    return null
  }
  const total = artifact.minimum_draft_field_keys.length
  const satisfied = artifact.minimum_draft_satisfied_count
  const missingKeys = artifact.minimum_draft_field_keys.filter((key) =>
    artifact.blockers.some((blocker) => blocker.field_key === key)
  )
  const nextKey = missingKeys[0]
  return (
    <div className="border-border/70 bg-background rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <p className="font-medium">Draft unlock</p>
        <p className="text-muted-foreground tabular-nums">
          {satisfied} of {total} core fields
        </p>
      </div>
      <Progress
        value={(satisfied / total) * 100}
        className="mt-2 h-1.5"
        aria-label={`${satisfied} of ${total} core fields present`}
      />
      {satisfied < total ? (
        <p className="text-muted-foreground mt-2 text-xs">
          {nextKey
            ? `Add ${nextKey.replaceAll("_", " ")} in chat to unlock a draft.`
            : "Add the remaining core fields in chat to unlock a draft."}
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
          Core fields present — remaining gaps will be labeled honestly in the
          draft.
        </p>
      )}
    </div>
  )
}

function GenerationProgress({
  state,
  artifact,
}: {
  state: GenerationState
  artifact: ArtifactRead
}) {
  const topBlocker = artifact.blockers[0]
  // The backend only reports 0 -> 10 -> 100, so the bar would sit frozen at
  // 10% for the whole LLM run. Creep toward 85% on elapsed ticks instead and
  // cycle the trust narrative on the same client interval (one tick = 2.5s).
  const [elapsedTick, setElapsedTick] = useState(0)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedTick((tick) => tick + 1)
    }, 2500)
    return () => window.clearInterval(interval)
  }, [])
  const creepProgress = Math.min(85, 10 + elapsedTick * 4)
  const displayProgress = Math.max(state.progress, creepProgress, 5)
  const displayLabel =
    state.activityLabel && elapsedTick % 2 === 0
      ? state.activityLabel
      : narrativeLabelAt(elapsedTick)
  return (
    <div className="border-border/70 bg-background rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Loader2
          className="text-brand size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">Drafting from your evidence</p>
      </div>
      <Progress
        value={displayProgress}
        className="mt-3 h-1.5"
        aria-hidden="true"
      />
      <p aria-live="polite" className="text-muted-foreground mt-2 text-xs">
        {displayLabel}
      </p>
      {topBlocker ? (
        <p className="text-muted-foreground border-border/60 mt-3 border-t pt-2 text-xs">
          While this drafts, you could strengthen:{" "}
          <span className="text-foreground font-medium">
            {topBlocker.next_action.label}
          </span>
        </p>
      ) : null}
    </div>
  )
}

function ArtifactDetailPanel({
  artifact,
  projectId,
  generationState,
  onGenerate,
  onRecheck,
  onAskInChat,
  versionRefreshToken,
  className,
  detailRef,
}: {
  artifact: ArtifactRead | null
  projectId: string
  generationState: GenerationState | null
  onGenerate: () => void
  onRecheck: () => void
  onAskInChat?: ((question: string) => void) | undefined
  versionRefreshToken: number
  className?: string | undefined
  detailRef: React.Ref<HTMLElement>
}) {
  const [viewedVersion, setViewedVersion] =
    useState<ArtifactVersionRead | null>(null)

  // Local version selection resets per artifact via the key prop on this
  // panel (key-based remount instead of a sync-setState effect).

  const handleSelectVersion = useCallback((version: ArtifactVersionRead) => {
    setViewedVersion(version)
  }, [])

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

  const state = generationState
  const isInFlight = state ? IN_FLIGHT_PHASES.has(state.phase) : false
  const latestVersion = state?.resultVersion ?? artifact.current_version ?? null
  const displayedVersion = viewedVersion ?? latestVersion
  const viewingOlder =
    viewedVersion !== null &&
    latestVersion !== null &&
    viewedVersion.public_id !== latestVersion.public_id

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

      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 lg:max-h-none">
        {/* Generation surface: in-flight > failure > preview > CTA > blocked */}
        {isInFlight && state ? (
          <GenerationProgress state={state} artifact={artifact} />
        ) : state?.phase === "failed" || state?.phase === "timeout" ? (
          <div className="border-border/70 bg-background rounded-lg border p-4">
            <p className="text-sm font-medium">
              {state.phase === "timeout"
                ? "Still working in the background"
                : "Draft didn't complete"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{state.error}</p>
            {state.phase === "failed" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={onGenerate}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Try again
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={onRecheck}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Check again
              </Button>
            )}
          </div>
        ) : displayedVersion ? (
          <div className="border-border/70 bg-background rounded-lg border p-4">
            {viewingOlder ? (
              <p className="text-muted-foreground border-border/60 mb-3 border-b pb-2 text-xs">
                Viewing an older internal draft.{" "}
                <button
                  type="button"
                  className="text-brand font-medium underline-offset-2 hover:underline"
                  onClick={() => setViewedVersion(null)}
                >
                  Back to latest
                </button>
              </p>
            ) : null}
            <ArtifactVersionPreview
              version={displayedVersion}
              artifact={artifact}
              onRegenerate={
                artifact.can_create_version ? onGenerate : undefined
              }
              onAskInChat={onAskInChat}
              isRegenerating={isInFlight}
            />
            {artifact.id === "pitch_deck_draft" ? (
              <ArtifactDeckPreview version={displayedVersion} />
            ) : null}
            {!viewingOlder && artifact.can_create_version ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={onGenerate}
                disabled={isInFlight}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Regenerate draft
              </Button>
            ) : null}
          </div>
        ) : artifact.can_create_version ? (
          <div className="border-border/70 bg-background rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-brand size-4" aria-hidden="true" />
              <p className="text-sm font-medium">Ready to draft</p>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Drafts from your current Company Map evidence snapshot. Internal
              draft — review before sharing.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full gap-1.5"
              onClick={onGenerate}
              disabled={isInFlight}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Generate source-backed draft
            </Button>
          </div>
        ) : (
          <div className="border-border/70 bg-background rounded-lg border p-4">
            <p className="text-sm font-medium">
              Needs evidence before drafting
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {artifact.create_version_disabled_reason ??
                "Add the blocked Company Map fields to unlock a draft."}
            </p>
          </div>
        )}

        <UnlockMeter artifact={artifact} />

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

        <ArtifactVersionHistory
          projectId={projectId}
          artifactId={artifact.id}
          selectedVersionId={displayedVersion?.public_id ?? null}
          onSelectVersion={handleSelectVersion}
          refreshToken={versionRefreshToken}
        />

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
                  {onAskInChat ? (
                    <button
                      type="button"
                      className="text-brand mt-1 text-xs font-medium underline-offset-2 hover:underline"
                      onClick={() => onAskInChat(blocker.next_action.label)}
                    >
                      {blocker.next_action.label}
                    </button>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {blocker.next_action.label}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">
                No blockers remain.
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
                No evidence has been attached yet — your chat answers become
                sources here.
              </p>
            )}
          </div>
        </section>

        <p className="text-muted-foreground text-xs">
          {artifact.export_disabled_reason}
        </p>
      </div>
    </aside>
  )
}
