import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"

const baseUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:3001"
const outputDir = new URL("../output/playwright-goal004/", import.meta.url)
mkdirSync(outputDir, { recursive: true })

const now = new Date("2026-05-31T18:00:00.000Z").toISOString()
const projectId = "11111111-1111-4111-8111-111111111111"
const conversationId = "22222222-2222-4222-8222-222222222222"
const branchId = "33333333-3333-4333-8333-333333333333"

const user = {
  id: "44444444-4444-4444-8444-444444444444",
  email: "qa@example.com",
  username: "qa",
  is_active: true,
  created_at: now,
  role: {
    id: "55555555-5555-4555-8555-555555555555",
    name: "participant",
    description: "Participant",
  },
}

const project = {
  id: projectId,
  owner_user_id: user.id,
  name: "Responsive QA",
  current_goal: "Validate source-backed company map",
  current_stage: "Seed",
  target_outcome: "Raise a focused seed round",
  deadline_at: null,
  created_at: now,
  updated_at: now,
}

const conversation = {
  id: conversationId,
  project_id: projectId,
  title: "Candidate review QA",
  status: "active",
  created_at: now,
  updated_at: now,
}

const problemCustomerDoc = {
  id: "66666666-6666-4666-8666-666666666666",
  conversation_id: conversationId,
  checklist: {
    sections: {
      target_customer: {
        done: true,
        summary: "SMB retailers with recurring stockout pain.",
      },
      customer_problem: {
        done: true,
        summary:
          "Teams miss replenishment signals until revenue is already lost.",
      },
      problem_severity: { done: false, summary: "" },
      current_workaround: { done: false, summary: "" },
      why_now: {
        done: true,
        summary:
          "New POS integrations make near-real-time monitoring possible.",
      },
      customer_access: { done: false, summary: "" },
      willingness_to_pay: { done: false, summary: "" },
      early_validation: {
        done: true,
        summary: "Three design partners agreed to weekly pilots.",
      },
    },
  },
  completion_percentage: 50,
  created_at: now,
  updated_at: now,
}

const memoryPin = {
  id: "77777777-7777-4777-8777-777777777777",
  project_id: projectId,
  conversation_id: conversationId,
  pin_type: "fact",
  payload: {
    title: "Founder statement",
    content: "SMB retailers lose revenue when stockouts are detected late.",
  },
  is_archived: false,
  status: "suggested",
  title: "Founder statement",
  content: "SMB retailers lose revenue when stockouts are detected late.",
  field_key: "customer_problem",
  source_message_id: "88888888-8888-4888-8888-888888888888",
  source_document_id: null,
  source_document_label: null,
  source_fingerprint: "pin-fingerprint",
  created_at: now,
  updated_at: now,
}

const fields = [
  {
    key: "target_customer",
    label: "Target customer",
    value: "SMB retailers with recurring stockout pain.",
    support_label: "Supported",
    evidence: [],
    blockers: [],
    stale: false,
    stale_reason: null,
    next_action: "Use this in artifact drafts with source attribution.",
    revision_id: "99999999-9999-4999-8999-999999999999",
    candidate_count: 1,
    contradiction_count: 0,
  },
  {
    key: "customer_problem",
    label: "Customer problem",
    value: "Teams miss replenishment signals until revenue is already lost.",
    support_label: "Supported",
    evidence: [],
    blockers: [],
    stale: false,
    stale_reason: null,
    next_action: "Use this in artifact drafts with source attribution.",
    revision_id: null,
    candidate_count: 0,
    contradiction_count: 0,
  },
  {
    key: "early_validation",
    label: "Early validation",
    value: "Three design partners agreed to weekly pilots.",
    support_label: "Supported",
    evidence: [],
    blockers: [],
    stale: false,
    stale_reason: null,
    next_action: "Use this in artifact drafts with source attribution.",
    revision_id: null,
    candidate_count: 0,
    contradiction_count: 0,
  },
  {
    key: "market_size",
    label: "Market size",
    value: null,
    support_label: "Missing",
    evidence: [],
    blockers: [
      {
        id: "market-size-blocker",
        message: "No sourced TAM/SAM/SOM estimate is available.",
        severity: "high",
        next_action:
          "Add a bottom-up market sizing assumption with source links.",
      },
    ],
    stale: false,
    stale_reason: null,
    next_action: "Add a bottom-up market sizing assumption with source links.",
    revision_id: null,
    candidate_count: 0,
    contradiction_count: 0,
  },
]

const candidate = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  project_id: projectId,
  field_key: "target_customer",
  field_label: "Target customer",
  suggested_value: "Regional grocery operators with weekly stockout losses.",
  rationale: "Founder named a more specific buyer segment in the latest call.",
  status: "suggested",
  is_conflict: true,
  conflict_summary: "Existing Target customer differs from new source support.",
  source_pin_id: memoryPin.id,
  source_message_id: memoryPin.source_message_id,
  source_document_id: null,
  source_document_label: null,
  source_fingerprint: "candidate-fingerprint",
  baseline_revision_id: fields[0].revision_id,
  edited_value: null,
  clarification_question: null,
  accepted_revision_id: null,
  created_at: now,
  updated_at: now,
}

const companyMap = {
  project_id: projectId,
  groups: [
    {
      key: "core",
      label: "Core narrative",
      description: "The minimum evidence needed for an investor-safe story.",
      fields,
    },
  ],
  candidates: [candidate],
  reviewed_candidates: [],
  capture_receipt: {
    pin_count: 1,
    candidate_count: 1,
    contradiction_count: 1,
    processing_state: "processed",
  },
}

const artifactHub = {
  project_id: projectId,
  artifacts: [
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Investor one-pager",
      description: "A concise narrative artifact.",
      readiness: "Draftable",
      source_strength: {
        label: "Mixed",
        supported_fields: 3,
        weak_fields: 0,
        missing_fields: 1,
        contradicted_fields: 1,
        total_fields: 5,
      },
      blocker_count: 2,
      stale_status: {
        is_stale: true,
        label: "Needs review",
        reason: "A candidate contradicts a current Company Map field.",
      },
      version_state: { label: "No draft", detail: null },
      next_best_action: {
        label: "Review target customer contradiction",
        field_key: "target_customer",
        blocker_id: "target_customer-blocker",
      },
      blockers: [
        {
          id: "target_customer-blocker",
          scope: "field",
          message: "Review target customer contradiction.",
          severity: "high",
          field_key: "target_customer",
          next_action: {
            label: "Review candidate",
            field_key: "target_customer",
            blocker_id: "target_customer-blocker",
          },
        },
      ],
      required_field_keys: [
        "target_customer",
        "customer_problem",
        "market_size",
      ],
      evidence: [],
      generation_disabled_reason:
        "Generation/export disabled until blockers are resolved.",
      export_disabled_reason:
        "Generation/export disabled until blockers are resolved.",
    },
  ],
}

const workspace = {
  project,
  conversation,
  messages: [
    {
      id: memoryPin.source_message_id,
      conversation_id: conversationId,
      role: "user",
      content:
        "We focus on regional grocery operators with weekly stockout losses.",
      sequence: 1,
      created_at: now,
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      conversation_id: conversationId,
      role: "assistant",
      content: "Captured as a candidate Company Map update.",
      sequence: 2,
      created_at: now,
    },
  ],
  memory_pins: [memoryPin],
  problem_customer_doc: problemCustomerDoc,
  company_map: companyMap,
  artifact_hub: artifactHub,
  user_display_name: "QA",
}

const ideaHistory = {
  version: 1,
  main_branch_id: branchId,
  branches: [
    {
      id: branchId,
      name: "main",
      created_at: now,
      forked_from_checkpoint_id: null,
      parent_branch_id: branchId,
      head_checkpoint_id: null,
      status: "active",
    },
  ],
  checkpoints: [],
  conversation_bindings: [
    {
      conversation_id: conversationId,
      branch_id: branchId,
      base_checkpoint_id: null,
      last_checkpoint_id: null,
    },
  ],
  one_off_sessions: [],
}

function json(body, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  }
}

async function mockApi(page) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (process.env.QA_DEBUG) {
      console.log(`${route.request().method()} ${path}`)
    }

    if (path === "/api/v1/auth/me") {
      await route.fulfill(json(user))
      return
    }
    if (path === `/api/v1/projects/${projectId}`) {
      await route.fulfill(json(project))
      return
    }
    if (
      path ===
      `/api/v1/projects/${projectId}/conversations/${conversationId}/workspace`
    ) {
      await route.fulfill(json(workspace))
      return
    }
    if (path === `/api/v1/projects/${projectId}/conversations/`) {
      await route.fulfill(json({ items: [conversation], next_cursor: null }))
      return
    }
    if (path === `/api/v1/projects/${projectId}/company-map`) {
      await route.fulfill(json(companyMap))
      return
    }
    if (path === `/api/v1/projects/${projectId}/pins`) {
      await route.fulfill(json([memoryPin]))
      return
    }
    if (path === `/api/v1/projects/${projectId}/artifacts`) {
      await route.fulfill(json(artifactHub))
      return
    }
    if (path === `/api/v1/projects/${projectId}/idea-history`) {
      await route.fulfill(json(ideaHistory))
      return
    }
    if (
      path ===
      `/api/v1/projects/${projectId}/idea-history/conversations/${conversationId}/binding`
    ) {
      await route.fulfill(json(ideaHistory.conversation_bindings[0]))
      return
    }

    await route.fulfill(json({ detail: `Unhandled mock route: ${path}` }, 404))
  })
}

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
]

for (const viewport of viewports) {
  test(`workspace responsive candidate review at ${viewport.name}`, async ({
    page,
  }) => {
    test.setTimeout(45_000)
    await page.setViewportSize(viewport)
    const consoleIssues = []

    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleIssues.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on("pageerror", (error) => {
      consoleIssues.push(`pageerror: ${error.message}`)
    })

    await mockApi(page)
    await page.goto(
      `${baseUrl}/projects/${projectId}/conversations/${conversationId}`,
      { waitUntil: "networkidle" }
    )
    await expect(page.getByTestId("company-map")).toBeVisible()
    await page.screenshot({
      path: new URL(`workspace-${viewport.name}.png`, outputDir).pathname,
      fullPage: true,
    })

    const metrics = await page.evaluate(() => {
      const acceptButton = [...document.querySelectorAll("button")].find(
        (button) => button.textContent?.trim() === "Accept"
      )
      const sourceButton = document.querySelector(
        'button[aria-label^="Open chat context"]'
      )
      const shell = document.documentElement
      const acceptRect = acceptButton?.getBoundingClientRect()
      const sourceRect = sourceButton?.getBoundingClientRect()
      return {
        hasHorizontalOverflow: shell.scrollWidth > shell.clientWidth + 1,
        acceptVisible: Boolean(
          acceptRect &&
          acceptRect.width > 0 &&
          acceptRect.height > 0 &&
          acceptRect.bottom <= window.innerHeight
        ),
        sourceVisible: Boolean(
          sourceRect &&
          sourceRect.width > 0 &&
          sourceRect.height > 0 &&
          sourceRect.bottom <= window.innerHeight
        ),
        mobileContextCollapsed:
          window.innerWidth > 767 ||
          document.body.textContent?.includes("Show context") === true,
      }
    })

    expect(consoleIssues).toEqual([])
    expect(metrics.hasHorizontalOverflow).toBe(false)
    expect(metrics.acceptVisible).toBe(true)
    expect(metrics.sourceVisible).toBe(true)
    expect(metrics.mobileContextCollapsed).toBe(true)
  })
}
