"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Archive,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  archiveHostedPage,
  createHostedPage,
  getHostedPage,
  getHostedPageAnalytics,
  linkHostedPageFeedback,
  listHostedPageFeedback,
  previewHostedPage,
  publishHostedPage,
} from "@/lib/api/hosted-pages"
import type {
  ArtifactHubRead,
  CompanyMapRead,
  HostedPageAnalyticsSummaryRead,
  HostedPageFeedbackRead,
  HostedPagePreviewRead,
  HostedPageRead,
  HostedPageStatus,
  HostedPageVisibility,
  HostedPageVisibilityConfig,
} from "@/lib/api/types"

type HostedPagePanelProps = {
  projectId: string
  artifactHub: ArtifactHubRead
  companyMap: CompanyMapRead
}

const EMPTY_ANALYTICS: HostedPageAnalyticsSummaryRead = {
  page_views: 0,
  cta_clicks: 0,
  artifact_downloads: 0,
  feedback_count: 0,
  latest_objections: [],
}

function visibleFields(companyMap: CompanyMapRead) {
  return companyMap.groups.flatMap((group) => group.fields)
}

function defaultConfig(
  artifactHub: ArtifactHubRead,
  companyMap: CompanyMapRead
): HostedPageVisibilityConfig {
  return {
    target_status: "private_share",
    fields: Object.fromEntries(
      visibleFields(companyMap).map((field) => [field.key, "hidden"])
    ),
    artifacts: artifactHub.artifacts
      .filter((artifact) => artifact.current_version)
      .map((artifact) => ({
        artifact_id: artifact.id,
        artifact_version_id: artifact.current_version!.public_id,
        visibility: "summary" as HostedPageVisibility,
      })),
    allow_weak_private_claims: false,
  }
}

function publicPath(page: HostedPageRead | null): string | null {
  if (!page?.public_url_path) {
    return null
  }
  return page.public_url_path
}

function fieldKeyFromFeedback(
  item: HostedPageFeedbackRead,
  validFieldKeys: Set<string>
): string {
  const metadataFieldKey = item.metadata_json.field_key
  return typeof metadataFieldKey === "string" &&
    validFieldKeys.has(metadataFieldKey)
    ? metadataFieldKey
    : ""
}

export function HostedPagePanel({
  projectId,
  artifactHub,
  companyMap,
}: HostedPagePanelProps) {
  const [page, setPage] = useState<HostedPageRead | null>(null)
  const [preview, setPreview] = useState<HostedPagePreviewRead | null>(null)
  const [analytics, setAnalytics] =
    useState<HostedPageAnalyticsSummaryRead>(EMPTY_ANALYTICS)
  const [feedback, setFeedback] = useState<HostedPageFeedbackRead[]>([])
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [feedbackFieldKeys, setFeedbackFieldKeys] = useState<
    Record<string, string>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<HostedPageVisibilityConfig>(() =>
    defaultConfig(artifactHub, companyMap)
  )

  const fields = useMemo(() => visibleFields(companyMap), [companyMap])
  const fieldKeySet = useMemo(
    () => new Set(fields.map((field) => field.key)),
    [fields]
  )
  const linkPath = publicPath(page)
  const needsPrivateTokenRotation =
    page?.status === "private_share" && page.current_revision && !shareToken
  const hostedUrl = useMemo(() => {
    if (!linkPath || typeof window === "undefined") {
      return linkPath
    }
    if (needsPrivateTokenRotation) {
      return null
    }
    const url = new URL(linkPath, window.location.origin)
    if (page?.status === "private_share" && shareToken) {
      url.searchParams.set("token", shareToken)
    }
    return url.toString()
  }, [linkPath, needsPrivateTokenRotation, page?.status, shareToken])

  const refresh = useCallback(async () => {
    setError(null)
    const [pageResult, analyticsResult, feedbackResult] = await Promise.all([
      getHostedPage(projectId).catch(async () =>
        createHostedPage(projectId, {
          cta_text: "Start a conversation",
        })
      ),
      getHostedPageAnalytics(projectId).catch(() => EMPTY_ANALYTICS),
      listHostedPageFeedback(projectId).catch(() => []),
    ])
    setPage(pageResult)
    setAnalytics(analyticsResult)
    setFeedback(feedbackResult)
    setFeedbackFieldKeys((current) => ({
      ...Object.fromEntries(
        feedbackResult.map((item) => [
          item.public_id,
          fieldKeyFromFeedback(item, fieldKeySet),
        ])
      ),
      ...current,
    }))
    const revisionConfig = pageResult.current_revision?.visibility_config
    if (revisionConfig) {
      setConfig(revisionConfig)
    }
  }, [fieldKeySet, projectId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        await refresh()
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load hosted page."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [refresh])

  async function runPreview() {
    setIsSaving(true)
    setError(null)
    try {
      const result = await previewHostedPage(projectId, config)
      setPreview(result)
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Could not preview hosted page."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function publish() {
    setIsSaving(true)
    setError(null)
    try {
      const result = await publishHostedPage(projectId, config)
      setPage(result.page)
      setShareToken(result.share_token)
      setPreview(null)
      toast.success("Hosted page published")
      await refresh()
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Could not publish hosted page."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function archive() {
    setIsSaving(true)
    setError(null)
    try {
      const result = await archiveHostedPage(projectId)
      setPage(result)
      toast.success("Hosted page archived")
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Could not archive hosted page."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function copyHostedUrl() {
    if (!hostedUrl || typeof navigator === "undefined") {
      return
    }
    await navigator.clipboard.writeText(hostedUrl)
    toast.success("Hosted page URL copied")
  }

  async function linkFeedback(feedbackId: string, fieldKey: string) {
    setIsSaving(true)
    try {
      await linkHostedPageFeedback(projectId, feedbackId, {
        action: "candidate",
        field_key: fieldKey,
      })
      setFeedback(await listHostedPageFeedback(projectId))
    } catch (linkError) {
      toast.error(
        linkError instanceof Error
          ? linkError.message
          : "Could not link feedback"
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function linkQuestion(
    feedbackItem: HostedPageFeedbackRead,
    fieldKey: string
  ) {
    setIsSaving(true)
    try {
      await linkHostedPageFeedback(projectId, feedbackItem.public_id, {
        action: "question",
        field_key: fieldKey,
        question: feedbackItem.body,
      })
      setFeedback(await listHostedPageFeedback(projectId))
    } catch (linkError) {
      toast.error(
        linkError instanceof Error
          ? linkError.message
          : "Could not link feedback"
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function dismissFeedback(feedbackId: string) {
    setIsSaving(true)
    try {
      await linkHostedPageFeedback(projectId, feedbackId, {
        action: "dismiss",
      })
      setFeedback(await listHostedPageFeedback(projectId))
    } catch (dismissError) {
      toast.error(
        dismissError instanceof Error
          ? dismissError.message
          : "Could not dismiss feedback"
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="bg-background flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </section>
    )
  }

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col">
      <div className="border-border/70 shrink-0 border-b px-4 py-4 sm:px-6">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Hosted Page
        </p>
        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Shareable investor page</h2>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
              <span>Status: {page?.status ?? "draft"}</span>
              {page?.current_revision ? (
                <span>Revision {page.current_revision.version_number}</span>
              ) : null}
              {page?.current_revision_stale ? (
                <span className="text-amber-700">Republish needed</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runPreview}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Preview
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={publish}
              disabled={isSaving}
            >
              <Send className="size-4" />
              Publish
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={archive}
              disabled={isSaving || page?.status === "archived"}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </div>
        </div>
      </div>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
      >
        {error ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive mb-4 rounded-lg border p-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <label className="text-sm font-medium" htmlFor="hosted-status">
                Share mode
              </label>
              <select
                id="hosted-status"
                className="border-input bg-background mt-2 h-9 w-full rounded-md border px-3 text-sm"
                value={config.target_status}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    target_status: event.target.value as HostedPageStatus,
                  }))
                }
              >
                <option value="private_share">Private link</option>
                <option value="gated">Email gated</option>
                <option value="public">Public</option>
              </select>
              {needsPrivateTokenRotation ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  Private token is only shown right after publishing. Publish a
                  new private link to rotate and copy a fresh URL.
                </p>
              ) : null}
              {hostedUrl ? (
                <div className="mt-3 space-y-2">
                  <p className="border-border bg-background text-muted-foreground rounded-md border px-3 py-2 text-xs break-all">
                    {hostedUrl}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void copyHostedUrl()}
                    >
                      <Copy className="size-4" />
                      Copy URL
                    </Button>
                    <Button asChild type="button" size="sm" variant="outline">
                      <a href={hostedUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Open hosted page
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <h3 className="font-medium">Artifacts</h3>
              <div className="mt-3 divide-y">
                {artifactHub.artifacts.map((artifact) => {
                  const currentVersion = artifact.current_version
                  const selected = config.artifacts.find(
                    (item) => item.artifact_id === artifact.id
                  )
                  return (
                    <div
                      key={artifact.id}
                      className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_160px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {artifact.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {currentVersion
                            ? `Version ${currentVersion.version_number} · ${currentVersion.share_safety_status}`
                            : "No generated version"}
                        </p>
                      </div>
                      <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        disabled={!currentVersion}
                        value={selected?.visibility ?? "hidden"}
                        onChange={(event) => {
                          const visibility = event.target
                            .value as HostedPageVisibility
                          setConfig((current) => ({
                            ...current,
                            artifacts: currentVersion
                              ? [
                                  ...current.artifacts.filter(
                                    (item) => item.artifact_id !== artifact.id
                                  ),
                                  {
                                    artifact_id: artifact.id,
                                    artifact_version_id:
                                      currentVersion.public_id,
                                    visibility,
                                  },
                                ]
                              : current.artifacts,
                          }))
                        }}
                      >
                        <option value="hidden">Hidden</option>
                        <option value="summary">Summary</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <h3 className="font-medium">Company Map fields</h3>
              <div className="mt-3 divide-y">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_160px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {field.label}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {field.support_label}
                      </p>
                    </div>
                    <select
                      className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                      value={config.fields[field.key] ?? "hidden"}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            [field.key]: event.target
                              .value as HostedPageVisibility,
                          },
                        }))
                      }
                    >
                      <option value="hidden">Hidden</option>
                      <option value="summary">Summary</option>
                      <option value="full">Full</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <h3 className="font-medium">Share safety</h3>
              {preview ? (
                <div className="mt-3 space-y-3">
                  <p className="inline-flex items-center gap-2 text-sm font-medium">
                    {preview.share_safety.allowed ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="size-4 text-amber-700" />
                    )}
                    {preview.share_safety.status}
                  </p>
                  {preview.share_safety.blockers.length ? (
                    <ul className="space-y-2 text-sm">
                      {preview.share_safety.blockers.map((blocker) => (
                        <li
                          key={blocker.id}
                          className="border-border/70 rounded-md border p-2"
                        >
                          {blocker.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  Backend policy results appear after preview.
                </p>
              )}
            </div>

            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <h3 className="font-medium">Analytics</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Views</dt>
                  <dd className="font-medium">{analytics.page_views}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CTA</dt>
                  <dd className="font-medium">{analytics.cta_clicks}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Downloads</dt>
                  <dd className="font-medium">
                    {analytics.artifact_downloads}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Feedback</dt>
                  <dd className="font-medium">{analytics.feedback_count}</dd>
                </div>
              </dl>
            </div>

            <div className="border-border/80 bg-surface-elevated/70 rounded-lg border p-4">
              <h3 className="font-medium">Feedback</h3>
              <div className="mt-3 space-y-3">
                {feedback.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No feedback yet.
                  </p>
                ) : (
                  feedback.map((item) => {
                    const selectedFieldKey =
                      feedbackFieldKeys[item.public_id] ?? ""
                    return (
                      <div
                        key={item.public_id}
                        className="border-border/70 rounded-md border p-3"
                      >
                        <p className="text-xs font-medium uppercase">
                          {item.feedback_type}
                        </p>
                        <p className="mt-1 text-sm">{item.body}</p>
                        <div className="mt-3 space-y-2">
                          <label
                            className="text-muted-foreground text-xs font-medium"
                            htmlFor={`feedback-field-${item.public_id}`}
                          >
                            Company Map field
                          </label>
                          <select
                            id={`feedback-field-${item.public_id}`}
                            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                            value={selectedFieldKey}
                            disabled={item.triage_status !== "new"}
                            onChange={(event) =>
                              setFeedbackFieldKeys((current) => ({
                                ...current,
                                [item.public_id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Choose field</option>
                            {fields.map((field) => (
                              <option key={field.key} value={field.key}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedFieldKey ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                isSaving || item.triage_status !== "new"
                              }
                              onClick={() =>
                                void linkFeedback(
                                  item.public_id,
                                  selectedFieldKey
                                )
                              }
                            >
                              Create candidate
                            </Button>
                          ) : null}
                          {selectedFieldKey ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                isSaving || item.triage_status !== "new"
                              }
                              onClick={() =>
                                void linkQuestion(item, selectedFieldKey)
                              }
                            >
                              Convert to question
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSaving || item.triage_status !== "new"}
                            onClick={() => void dismissFeedback(item.public_id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
