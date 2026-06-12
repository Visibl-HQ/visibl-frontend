import { apiJson } from "@/lib/api/client"
import type {
  HostedPageAnalyticsSummaryRead,
  HostedPageFeedbackLinkRead,
  HostedPageFeedbackRead,
  HostedPagePreviewRead,
  HostedPagePublicRead,
  HostedPagePublishRead,
  HostedPageRead,
  HostedPageVisibilityConfig,
} from "@/lib/api/types"

function hostedPagePath(projectId: string, suffix = ""): string {
  return `/projects/${projectId}/hosted-page${suffix}`
}

export async function getHostedPage(
  projectId: string
): Promise<HostedPageRead> {
  return apiJson<HostedPageRead>(hostedPagePath(projectId))
}

export async function createHostedPage(
  projectId: string,
  body: { slug?: string; cta_text?: string; contact_method?: string } = {}
): Promise<HostedPageRead> {
  return apiJson<HostedPageRead>(hostedPagePath(projectId), {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function previewHostedPage(
  projectId: string,
  visibilityConfig: HostedPageVisibilityConfig
): Promise<HostedPagePreviewRead> {
  return apiJson<HostedPagePreviewRead>(hostedPagePath(projectId, "/preview"), {
    method: "POST",
    body: JSON.stringify({ visibility_config: visibilityConfig }),
  })
}

export async function publishHostedPage(
  projectId: string,
  visibilityConfig: HostedPageVisibilityConfig
): Promise<HostedPagePublishRead> {
  return apiJson<HostedPagePublishRead>(hostedPagePath(projectId, "/publish"), {
    method: "POST",
    body: JSON.stringify({ visibility_config: visibilityConfig }),
  })
}

export async function archiveHostedPage(
  projectId: string
): Promise<HostedPageRead> {
  return apiJson<HostedPageRead>(hostedPagePath(projectId, "/archive"), {
    method: "POST",
  })
}

export async function getHostedPageAnalytics(
  projectId: string
): Promise<HostedPageAnalyticsSummaryRead> {
  return apiJson<HostedPageAnalyticsSummaryRead>(
    hostedPagePath(projectId, "/analytics/summary")
  )
}

export async function listHostedPageFeedback(
  projectId: string
): Promise<HostedPageFeedbackRead[]> {
  return apiJson<HostedPageFeedbackRead[]>(`/projects/${projectId}/feedback`)
}

export async function linkHostedPageFeedback(
  projectId: string,
  feedbackId: string,
  body:
    | { action: "dismiss" }
    | {
        action: "candidate" | "question"
        field_key: string
        suggested_value?: string
        question?: string
      }
): Promise<HostedPageFeedbackLinkRead> {
  return apiJson<HostedPageFeedbackLinkRead>(
    `/projects/${projectId}/feedback/${feedbackId}/link`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
}

function publicQuery(params?: {
  token?: string | null
  email?: string | null
}): string {
  const searchParams = new URLSearchParams()
  if (params?.token) {
    searchParams.set("token", params.token)
  }
  if (params?.email) {
    searchParams.set("email", params.email)
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export async function getPublicHostedPage(
  identifier: string,
  params?: { token?: string | null; email?: string | null }
): Promise<HostedPagePublicRead> {
  return apiJson<HostedPagePublicRead>(
    `/hosted/${encodeURIComponent(identifier)}${publicQuery(params)}`,
    undefined,
    { retryOnUnauthorized: false }
  )
}

export async function recordHostedPageEvent(
  identifier: string,
  body: {
    event_type: "page_view" | "cta_click" | "artifact_download"
    referrer?: string | null
    metadata_json?: Record<string, unknown>
  },
  params?: { token?: string | null; email?: string | null }
): Promise<void> {
  await apiJson<void>(
    `/hosted/${encodeURIComponent(identifier)}/events${publicQuery(params)}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { retryOnUnauthorized: false }
  )
}

export async function submitHostedPageFeedback(
  identifier: string,
  body: {
    feedback_type: "comment" | "objection" | "intro_request" | "question"
    body: string
    contact_email?: string | null
    metadata_json?: Record<string, unknown>
  },
  params?: { token?: string | null; email?: string | null }
): Promise<HostedPageFeedbackRead> {
  return apiJson<HostedPageFeedbackRead>(
    `/hosted/${encodeURIComponent(identifier)}/feedback${publicQuery(params)}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { retryOnUnauthorized: false }
  )
}
