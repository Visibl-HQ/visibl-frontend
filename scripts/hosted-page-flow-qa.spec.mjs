import assert from "node:assert/strict"
import { mkdirSync } from "node:fs"
import { createServer } from "node:http"
import { chromium } from "@playwright/test"

const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001"
const mockApiPort = Number(process.env.MOCK_API_PORT ?? 4012)
const outputDir = new URL("../output/playwright-goal014/", import.meta.url)
mkdirSync(outputDir, { recursive: true })

const now = new Date("2026-06-12T12:00:00.000Z").toISOString()
const projectId = "proj_goal013_public"
const conversationId = "conv_goal013_public"
const hostedPageId = "hp_goal013_public"
const revisionId = "hprev_goal013_public"
const artifactVersionId = "av_goal013_one_pager"
const privateToken = "private-token-goal013"

const user = {
  id: "user_goal013",
  email: "qa@example.com",
  username: "qa",
  is_active: true,
  created_at: now,
  role: {
    id: "role_participant",
    name: "participant",
    description: "Participant",
  },
}

const project = {
  public_id: projectId,
  name: "Responsive QA",
  current_goal: "Publish source-backed investor context",
  current_stage: "Seed",
  target_outcome: "Share a controlled one-pager",
  deadline_at: null,
  created_at: now,
  updated_at: now,
}

const conversation = {
  public_id: conversationId,
  project_public_id: projectId,
  title: "Share flow QA",
  status: "active",
  created_at: now,
  updated_at: now,
}

const fields = [
  {
    key: "target_customer",
    label: "Target customer",
    value: "Regional grocery operators with weekly stockout losses.",
    support_label: "Supported",
    evidence: [],
    blockers: [],
    stale: false,
    stale_reason: null,
    next_action: "Use this in artifact drafts with source attribution.",
    revision_id: "rev_target_customer",
    candidate_count: 0,
    contradiction_count: 0,
  },
  {
    key: "customer_problem",
    label: "Customer problem",
    value: "Teams miss replenishment signals until revenue is already lost.",
    support_label: "Share-safe",
    evidence: [],
    blockers: [],
    stale: false,
    stale_reason: null,
    next_action: "Use this in artifact drafts with source attribution.",
    revision_id: "rev_customer_problem",
    candidate_count: 0,
    contradiction_count: 0,
  },
]

const companyMap = {
  project_public_id: projectId,
  groups: [
    {
      key: "core",
      label: "Core narrative",
      description: "Source-backed public claims.",
      fields,
    },
  ],
  candidates: [],
  reviewed_candidates: [],
  capture_receipt: {
    pin_count: 0,
    candidate_count: 0,
    contradiction_count: 0,
    processing_state: "processed",
  },
}

const currentVersion = {
  public_id: artifactVersionId,
  artifact_id: "one_pager",
  version_number: 1,
  created_at: now,
  dependency_hash: "artifact-dependency-hash",
  is_stale: false,
  stale_reason: null,
  content_schema_version: 1,
  content: {
    schema_version: 1,
    artifact_id: "one_pager",
    title: "Investor one-pager",
    summary:
      "A source-backed overview for investors reviewing the company narrative.",
    source_snapshot_id: "snapshot_goal013",
    source_scope: "project",
    sections: [
      {
        id: "field-target_customer",
        label: "Target customer",
        field_key: "target_customer",
        value: fields[0].value,
        support_label: "Supported",
        source_refs: [],
        caveats: [],
      },
      {
        id: "field-customer_problem",
        label: "Customer problem",
        field_key: "customer_problem",
        value: fields[1].value,
        support_label: "Share-safe",
        source_refs: [],
        caveats: [],
      },
    ],
    caveats: [],
    generation_metadata: {
      template_version: "one_pager:v1",
      prompt_version: "qa",
      schema_version: 1,
      model: "qa",
      generator: "deterministic_fallback",
      source_snapshot_schema_version: 1,
    },
  },
  rendered_markdown: null,
  generation_label: "labels_required",
  share_safety_status: "approved",
  created_by_kind: "generation_job",
}

const artifactHub = {
  project_public_id: projectId,
  artifacts: [
    {
      id: "one_pager",
      name: "Investor one-pager",
      description: "A concise narrative artifact.",
      readiness: "Share review required",
      source_strength: {
        label: "Strong",
        supported_fields: 2,
        weak_fields: 0,
        missing_fields: 0,
        contradicted_fields: 0,
        total_fields: 2,
      },
      blocker_count: 0,
      stale_status: {
        is_stale: false,
        label: "Current",
        reason: null,
      },
      version_state: { label: "Version 1", detail: null },
      current_version: currentVersion,
      can_create_version: true,
      create_version_disabled_reason: null,
      minimum_draft_field_keys: ["target_customer", "customer_problem"],
      minimum_draft_satisfied_count: 2,
      next_best_action: {
        label: "Review share safety before publishing.",
        field_key: null,
        blocker_id: null,
      },
      blockers: [],
      required_field_keys: ["target_customer", "customer_problem"],
      evidence: [],
      generation_disabled_reason: null,
      export_disabled_reason: "Export disabled until share review is complete.",
    },
  ],
}

function projection(targetStatus = "public") {
  return {
    schema_version: 1,
    target_status: targetStatus,
    page: {
      public_id: hostedPageId,
      slug: "responsive-qa",
      cta_text: "Start a conversation",
      contact_method: "mailto:founder@example.com",
    },
    fields: [],
    artifacts: [
      {
        artifact_id: "one_pager",
        artifact_version_number: 1,
        visibility: "full",
        title: currentVersion.content.title,
        summary: currentVersion.content.summary,
        sections: currentVersion.content.sections.map((section) => ({
          id: section.id,
          label: section.label,
          field_key: section.field_key,
          value: section.value,
          support_label: section.support_label,
        })),
      },
    ],
  }
}

function createQaState() {
  return {
    page: {
      public_id: hostedPageId,
      project_public_id: projectId,
      slug: "responsive-qa",
      status: "draft",
      cta_text: "Start a conversation",
      contact_method: "mailto:founder@example.com",
      gate_config_json: {},
      current_revision: null,
      current_revision_stale: false,
      public_url_path: null,
    },
    analytics: {
      page_views: 0,
      cta_clicks: 0,
      artifact_downloads: 0,
      feedback_count: 0,
      latest_objections: [],
    },
    feedback: [],
    events: [],
    linkedFieldKey: null,
    lastGateFeedbackEmail: null,
  }
}

let qaState = createQaState()
let server

function response(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": baseUrl,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  })
  res.end(body === undefined ? "" : JSON.stringify(body))
}

function apiError(res, status, message) {
  response(res, status, {
    error: {
      code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
      message,
      request_id: "qa-request",
    },
  })
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? JSON.parse(raw) : {}
}

function hostedPageRevision(targetStatus) {
  return {
    public_id: revisionId,
    version_number: 1,
    status: targetStatus,
    source_dependency_hash: "projection-hash-goal013",
    visibility_config: {
      target_status: targetStatus,
      fields: {},
      artifacts: [
        {
          artifact_id: "one_pager",
          artifact_version_id: artifactVersionId,
          visibility: "full",
        },
      ],
    },
    share_safety_report: {
      allowed: true,
      status: "pass",
      target_status: targetStatus,
      blockers: [],
      source_dependency_hash: "projection-hash-goal013",
    },
    created_at: now,
  }
}

function gatedEmail(url) {
  const email = url.searchParams.get("email")
  if (!email) {
    return { ok: false, status: 403, message: "Email gate required" }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      status: 400,
      message: "Enter a valid email address for gated access.",
    }
  }
  return { ok: true, email }
}

function authorizePublicRequest(url) {
  if (qaState.page.status === "public") {
    return { ok: true, email: null }
  }
  if (qaState.page.status === "private_share") {
    return url.searchParams.get("token") === privateToken
      ? { ok: true, email: null }
      : { ok: false, status: 403, message: "Hosted page access denied" }
  }
  if (qaState.page.status === "gated") {
    return gatedEmail(url)
  }
  return { ok: false, status: 404, message: "Hosted page not found" }
}

function startMockApi() {
  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${mockApiPort}`)
    const path = url.pathname
    const method = req.method ?? "GET"

    if (method === "OPTIONS") {
      response(res, 204)
      return
    }

    if (path === "/api/v1/auth/me") {
      response(res, 200, user)
      return
    }
    if (path === "/api/v1/users/qa/projects/responsive-qa") {
      response(res, 200, project)
      return
    }
    if (path === `/api/v1/projects/${projectId}`) {
      response(res, 200, project)
      return
    }
    if (path === `/api/v1/projects/${projectId}/company-map`) {
      response(res, 200, companyMap)
      return
    }
    if (path === `/api/v1/projects/${projectId}/artifacts`) {
      response(res, 200, artifactHub)
      return
    }
    if (path === `/api/v1/projects/${projectId}/conversations/`) {
      response(res, 200, { items: [conversation], next_cursor: null })
      return
    }
    if (path === `/api/v1/projects/${projectId}/pins`) {
      response(res, 200, [])
      return
    }
    if (path === `/api/v1/projects/${projectId}/idea-history`) {
      response(res, 200, {
        version: 1,
        main_branch_public_id: "main_branch",
        branches: [
          {
            public_id: "main_branch",
            name: "main",
            created_at: now,
            forked_from_checkpoint_public_id: null,
            parent_branch_public_id: "main_branch",
            head_checkpoint_public_id: null,
            status: "active",
          },
        ],
        checkpoints: [],
        conversation_bindings: [],
        one_off_sessions: [],
      })
      return
    }
    if (
      path ===
      `/api/v1/projects/${projectId}/idea-history/conversations/${conversationId}/binding`
    ) {
      response(res, 200, {
        conversation_public_id: conversationId,
        branch_public_id: "main_branch",
        base_checkpoint_public_id: null,
        last_checkpoint_public_id: null,
      })
      return
    }
    if (path === `/api/v1/projects/${projectId}/hosted-page`) {
      if (method === "POST") {
        await readJson(req)
      }
      response(res, 200, qaState.page)
      return
    }
    if (
      path === `/api/v1/projects/${projectId}/hosted-page/analytics/summary`
    ) {
      response(res, 200, qaState.analytics)
      return
    }
    if (path === `/api/v1/projects/${projectId}/feedback`) {
      response(res, 200, qaState.feedback)
      return
    }
    if (path === `/api/v1/projects/${projectId}/hosted-page/preview`) {
      const body = await readJson(req)
      const targetStatus = body.visibility_config.target_status
      response(res, 200, {
        share_safety: {
          allowed: true,
          status: "pass",
          target_status: targetStatus,
          blockers: [],
          source_dependency_hash: "projection-hash-goal013",
        },
        projection: projection(targetStatus),
      })
      return
    }
    if (path === `/api/v1/projects/${projectId}/hosted-page/publish`) {
      const body = await readJson(req)
      const targetStatus = body.visibility_config.target_status
      qaState.page = {
        ...qaState.page,
        status: targetStatus,
        current_revision: hostedPageRevision(targetStatus),
        public_url_path: `/hosted/${hostedPageId}`,
      }
      response(res, 200, {
        page: qaState.page,
        share_token: targetStatus === "private_share" ? privateToken : null,
      })
      return
    }
    if (path === `/api/v1/hosted/${hostedPageId}`) {
      const auth = authorizePublicRequest(url)
      if (!auth.ok) {
        apiError(res, auth.status, auth.message)
        return
      }
      response(res, 200, {
        public_id: hostedPageId,
        slug: "responsive-qa",
        status: qaState.page.status,
        revision_public_id: revisionId,
        projection: projection(qaState.page.status),
      })
      return
    }
    if (path === `/api/v1/hosted/${hostedPageId}/events`) {
      const auth = authorizePublicRequest(url)
      if (!auth.ok) {
        apiError(res, auth.status, auth.message)
        return
      }
      const body = await readJson(req)
      qaState.events.push({ ...body, gate_email: auth.email ?? null })
      if (body.event_type === "page_view") {
        qaState.analytics.page_views += 1
      }
      if (body.event_type === "cta_click") {
        qaState.analytics.cta_clicks += 1
      }
      response(res, 204)
      return
    }
    if (path === `/api/v1/hosted/${hostedPageId}/feedback`) {
      const auth = authorizePublicRequest(url)
      if (!auth.ok) {
        apiError(res, auth.status, auth.message)
        return
      }
      const body = await readJson(req)
      const metadata = {
        ...(body.metadata_json ?? {}),
        ...(auth.email ? { gate_email: auth.email } : {}),
      }
      const feedback = {
        public_id: `feedback_${qaState.feedback.length + 1}`,
        page_public_id: hostedPageId,
        revision_public_id: revisionId,
        feedback_type: body.feedback_type,
        body: body.body,
        contact_email: body.contact_email ?? auth.email ?? null,
        triage_status: "new",
        metadata_json: metadata,
        created_at: now,
      }
      qaState.feedback = [feedback, ...qaState.feedback]
      qaState.analytics.feedback_count = qaState.feedback.length
      qaState.lastGateFeedbackEmail = metadata.gate_email ?? null
      if (body.feedback_type === "objection") {
        qaState.analytics.latest_objections = [
          body.body,
          ...qaState.analytics.latest_objections,
        ].slice(0, 5)
      }
      response(res, 201, feedback)
      return
    }
    if (
      path.startsWith(`/api/v1/projects/${projectId}/feedback/`) &&
      path.endsWith("/link")
    ) {
      const body = await readJson(req)
      const feedbackId = path.split("/").at(-2)
      qaState.linkedFieldKey = body.field_key ?? null
      qaState.feedback = qaState.feedback.map((feedback) =>
        feedback.public_id === feedbackId
          ? {
              ...feedback,
              triage_status: "linked",
              metadata_json: {
                ...feedback.metadata_json,
                linked_action: body.action,
                linked_field_key: body.field_key,
                candidate_public_id: `candidate_${feedbackId}`,
              },
            }
          : feedback
      )
      response(res, 200, {
        feedback: qaState.feedback.find(
          (feedback) => feedback.public_id === feedbackId
        ),
        candidate_public_id: `candidate_${feedbackId}`,
      })
      return
    }

    response(res, 404, { detail: `Unhandled mock route: ${method} ${path}` })
  })

  return new Promise((resolve) => {
    server.listen(mockApiPort, "127.0.0.1", resolve)
  })
}

async function assertVisible(locator) {
  await locator.waitFor({ state: "visible", timeout: 10_000 })
}

async function assertNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  )
  assert.equal(hasOverflow, false)
}

async function runViewport(browser, viewport) {
  qaState = createQaState()
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  })
  const page = await context.newPage()
  const consoleIssues = []

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => {
    consoleIssues.push(`pageerror: ${error.message}`)
  })
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = response.url()
      const expectedGateProbe =
        response.status() === 403 &&
        url.includes(`/api/v1/hosted/${hostedPageId}`) &&
        !url.includes("email=")
      if (!expectedGateProbe) {
        consoleIssues.push(`response ${response.status()}: ${url}`)
      }
    }
  })

  await page.goto(`${baseUrl}/qa/projects/responsive-qa/hosted-page`, {
    waitUntil: "networkidle",
  })
  await assertVisible(
    page.getByRole("heading", { name: "Shareable investor page" })
  )

  await page.locator("#hosted-status").selectOption("private_share")
  await page.locator("select").nth(1).selectOption("full")
  await page.getByRole("button", { name: "Preview" }).click()
  await assertVisible(page.getByText("pass"))
  await page.getByRole("button", { name: "Publish" }).click()
  await assertVisible(page.getByText("Status: private_share"))
  const privateHref = await page
    .getByRole("link", { name: /Open hosted page/ })
    .getAttribute("href")
  assert.match(privateHref ?? "", /token=private-token-goal013/)
  await page.goto(new URL(privateHref, baseUrl).toString(), {
    waitUntil: "networkidle",
  })
  await assertVisible(page.locator("h1", { hasText: "Investor one-pager" }))

  await page.goto(`${baseUrl}/qa/projects/responsive-qa/hosted-page`, {
    waitUntil: "networkidle",
  })
  await page.locator("#hosted-status").selectOption("gated")
  await page.getByRole("button", { name: "Publish" }).click()
  await assertVisible(page.getByText("Status: gated"))
  await page.goto(`${baseUrl}/hosted/${hostedPageId}`, {
    waitUntil: "networkidle",
  })
  await assertVisible(page.getByRole("heading", { name: "Enter your email" }))
  await page.locator("#gate-email").fill("not-an-email")
  assert.equal(
    await page
      .locator("#gate-email")
      .evaluate((input) => input.checkValidity()),
    false
  )
  await page.locator("#gate-email").fill("investor@example.com")
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL(/email=investor%40example\.com/)
  await assertVisible(page.locator("h1", { hasText: "Investor one-pager" }))
  await page.locator("select").selectOption("comment")
  await page.locator("textarea").fill("Gate feedback keeps the email.")
  await page.getByRole("button", { name: "Send feedback" }).click()
  await assertVisible(page.getByText("Feedback sent."))
  assert.equal(qaState.lastGateFeedbackEmail, "investor@example.com")
  assert.equal(
    qaState.events.some((event) => event.gate_email === "investor@example.com"),
    true
  )

  await page.goto(`${baseUrl}/qa/projects/responsive-qa/hosted-page`, {
    waitUntil: "networkidle",
  })
  await page.locator("#hosted-status").selectOption("public")
  await page.getByRole("button", { name: "Publish" }).click()
  await assertVisible(page.getByText("Status: public"))
  await page.screenshot({
    path: new URL(`workspace-hosted-${viewport.name}.png`, outputDir).pathname,
    fullPage: true,
  })

  await page.goto(`${baseUrl}/hosted/${hostedPageId}`, {
    waitUntil: "networkidle",
  })
  await assertVisible(page.locator("h1", { hasText: "Investor one-pager" }))
  await page.locator("select").selectOption("objection")
  await page.locator("textarea").fill("This needs a sharper proof point.")
  await page.locator('input[type="email"]').fill("investor@example.com")
  await page.getByRole("button", { name: "Send feedback" }).click()
  await assertVisible(page.getByText("Feedback sent."))
  await page.screenshot({
    path: new URL(`public-hosted-${viewport.name}.png`, outputDir).pathname,
    fullPage: true,
  })

  await page.goto(`${baseUrl}/qa/projects/responsive-qa/hosted-page`, {
    waitUntil: "networkidle",
  })
  await assertVisible(page.getByText("This needs a sharper proof point."))
  await page
    .locator("#feedback-field-feedback_2")
    .selectOption("customer_problem")
  await page.getByRole("button", { name: "Create candidate" }).click()
  assert.equal(qaState.linkedFieldKey, "customer_problem")
  assert.equal(
    await page.getByRole("button", { name: "Create candidate" }).isDisabled(),
    true
  )

  const bodyText = await page.evaluate(() => document.body.textContent ?? "")
  assert.match(bodyText, /Views/)
  assert.match(bodyText, /1/)
  assert.deepEqual(consoleIssues, [])
  await assertNoHorizontalOverflow(page)
  await context.close()
}

async function main() {
  await startMockApi()
  const browser = await chromium.launch()
  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 812 },
    ]) {
      await runViewport(browser, viewport)
    }
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
