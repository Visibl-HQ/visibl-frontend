import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const root = new URL("../", import.meta.url)

function read(path) {
  return readFileSync(new URL(path, root), "utf8")
}

test("workspace exposes Company Map, Artifact Hub, and Hosted Page as primary modes", () => {
  const shell = read("src/features/workspace/components/workspace-shell.tsx")
  const nav = read(
    "src/features/workspace/components/project-workspace-nav.tsx"
  )

  assert.match(shell, /Company Map/)
  assert.match(shell, /Artifact Hub/)
  assert.match(nav, /Hosted Page/)
  assert.match(shell, /workspaceSection === "company-map"/)
  assert.match(shell, /workspaceSection === "artifacts"/)
  assert.match(shell, /workspaceSection === "hosted-page"/)
  assert.match(shell, /<CompanyMapPanel/)
  assert.match(shell, /<ArtifactHubPanel/)
  assert.match(shell, /<HostedPagePanel/)
  assert.match(shell, /<WorkspaceContextSidebarContent/)
})

test("hosted page UI uses backend policy, public projection, analytics, and feedback actions", () => {
  const panel = read(
    "src/features/hosted-page/components/hosted-page-panel.tsx"
  )
  const publicPage = read(
    "src/features/hosted-page/components/public-hosted-page.tsx"
  )
  const api = read("src/lib/api/hosted-pages.ts")
  const authProvider = read("src/features/auth/components/auth-provider.tsx")

  for (const contract of [
    /previewHostedPage/,
    /publishHostedPage/,
    /archiveHostedPage/,
    /getHostedPageAnalytics/,
    /listHostedPageFeedback/,
    /linkHostedPageFeedback/,
    /share_safety/,
    /Create candidate/,
    /Convert to question/,
    /Dismiss/,
    /action: "dismiss"/,
    /Copy URL/,
    /searchParams\.set\("token", shareToken\)/,
    /needsPrivateTokenRotation/,
    /feedbackFieldKeys/,
    /Choose field/,
  ]) {
    assert.match(panel, contract)
  }
  assert.doesNotMatch(panel, /Token: \{shareToken\}/)
  assert.match(panel, /if \(needsPrivateTokenRotation\)[\s\S]*return null/)
  assert.match(authProvider, /PUBLIC_ROUTE_PREFIXES = \["\/hosted\/"\]/)

  assert.match(api, /\/hosted\/\$\{encodeURIComponent\(identifier\)\}/)
  assert.match(publicPage, /HostedPageEmailGate/)
  assert.match(publicPage, /safeContactHref/)
  assert.match(publicPage, /gate-email/)
  assert.match(publicPage, /recordHostedPageEvent/)
  assert.match(publicPage, /submitHostedPageFeedback/)
  assert.doesNotMatch(publicPage, /getCompanyMap|getArtifact|getWorkspace/)
})

test("artifact cards show required readiness signals", () => {
  const hub = read("src/features/workspace/components/artifact-hub-panel.tsx")

  for (const label of [
    "Source strength",
    "Blockers",
    "Stale status",
    "Version",
    "Next action",
    "Open detail",
  ]) {
    assert.match(hub, new RegExp(label))
  }

  assert.match(hub, /data-testid="artifact-detail"/)
  // goal-011 generation surface: CTA, in-flight, resume, honest-draft framing
  assert.match(hub, /Generate source-backed draft/)
  assert.match(hub, /useArtifactGeneration/)
  assert.match(hub, /generation.resume\(/)
  assert.match(hub, /Drafting…/)
  assert.match(hub, /aria-live="polite"/)
  assert.match(hub, /<ArtifactVersionPreview/)
  assert.match(hub, /<ArtifactVersionHistory/)
  assert.match(hub, /can_create_version/)
  assert.match(hub, /Needs evidence before drafting/)
})

test("generation poller runs to terminal state, never single-poll", () => {
  const poller = read("src/features/workspace/lib/wait-for-generation.ts")

  assert.match(poller, /for \(;;\)/)
  assert.match(poller, /status === "succeeded"/)
  assert.match(poller, /status === "failed"/)
  assert.match(poller, /status === "canceled"/)
  assert.match(poller, /GenerationTimeoutError/)
  assert.match(poller, /poll_interval_ms/)
})

test("version preview keeps the evidence trail and honest gaps visible", () => {
  const preview = read(
    "src/features/workspace/components/artifact-version-preview.tsx"
  )

  assert.match(preview, /SupportBadge/)
  assert.match(preview, /source_refs/)
  assert.match(preview, /caveats/)
  assert.match(preview, /Internal draft/)
  assert.match(preview, /Unlock this section in chat/)
  assert.match(preview, /sections are[\s\S]*source-backed/)
})

test("company map and inspector keep blockers and contradictions visible", () => {
  const companyMap = read(
    "src/features/workspace/components/company-map-panel.tsx"
  )
  const candidates = read(
    "src/features/workspace/components/company-map-candidate-queue.tsx"
  )
  const inspector = read(
    "src/features/workspace/components/artifact-inspector.tsx"
  )

  assert.match(companyMap, /Contradicted/)
  assert.match(companyMap, /Inspect next blocker/)
  assert.match(candidates, /Reviewed candidates/)
  assert.match(candidates, /onClarify/)
  assert.match(candidates, /clarification_question/)
  assert.match(candidates, /Open chat context/)
  assert.match(inspector, /blockers/)
  assert.match(inspector, /next_action/)
  assert.match(inspector, /Sources/)
})

test("live pin panel exposes review actions and source affordances", () => {
  const pins = read("src/features/workspace/components/memory-pins-panel.tsx")

  for (const contract of [
    /aria-label="Confirm pin"/,
    /aria-label="Edit pin"/,
    /aria-label="Archive pin"/,
    /Promote/,
    /Open chat context for source message/,
    /Open chat context for source document/,
    /onSelectField/,
    /field_key/,
  ]) {
    assert.match(pins, contract)
  }
})

test("candidate queue exposes review actions, audit trail, and source affordances", () => {
  const candidates = read(
    "src/features/workspace/components/company-map-candidate-queue.tsx"
  )
  const projectsApi = read("src/lib/api/projects.ts")
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  for (const contract of [
    /onAccept/,
    /onReplace/,
    /onEditAccept/,
    /onEditReplace/,
    /onReject/,
    /onArchive/,
    /onClarify/,
    /Reviewed candidates/,
    /Replace current/,
    /Replace with edit/,
    /source_document_id/,
    /source_document_label/,
    /Open chat context/,
    /Contradiction/,
  ]) {
    assert.match(candidates, contract)
  }

  assert.match(candidates, /candidates\.map/)
  assert.doesNotMatch(candidates, /candidates\.slice\(0,\s*4\)/)
  assert.match(candidates, /max-h-\[38rem\]/)
  assert.match(candidates, /overflow-y-auto/)
  assert.match(projectsApi, /allow_replace/)
  assert.match(projectsApi, /expected_revision_id/)
  assert.match(
    shell,
    /handleReplaceCandidate[\s\S]*allow_replace: true[\s\S]*expected_revision_id: expectedRevisionId/
  )
  assert.match(
    shell,
    /handleEditReplaceCandidate[\s\S]*editAcceptCandidate\(projectPublicId, candidate\.public_id, value,[\s\S]*allow_replace: true[\s\S]*expected_revision_id: expectedRevisionId/
  )
  assert.match(
    candidates,
    /await onEditReplace\([\s\S]*candidate,[\s\S]*draftValue,[\s\S]*currentRevisionId[\s\S]*setEditingId\(null\)/
  )
  assert.match(candidates, /!showReplaceFlow \? \([\s\S]*Accept edit/)
  assert.match(candidates, /keep the draft for retry/)
})

test("stale candidate conflicts refresh current revisions before replacement retry", () => {
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  for (const contract of [
    /handleAcceptCandidate[\s\S]*actionError instanceof ApiError && actionError\.status === 409[\s\S]*await refreshCaptureState\(\)[\s\S]*setStaleCandidateId\(candidate\.public_id\)/,
    /handleReplaceCandidate[\s\S]*actionError instanceof ApiError && actionError\.status === 409[\s\S]*await refreshCaptureState\(\)[\s\S]*setStaleCandidateId\(candidate\.public_id\)/,
    /handleEditAcceptCandidate[\s\S]*actionError instanceof ApiError && actionError\.status === 409[\s\S]*await refreshCaptureState\(\)[\s\S]*setStaleCandidateId\(candidate\.public_id\)/,
    /handleEditReplaceCandidate[\s\S]*actionError instanceof ApiError && actionError\.status === 409[\s\S]*await refreshCaptureState\(\)[\s\S]*setStaleCandidateId\(candidate\.public_id\)/,
  ]) {
    assert.match(shell, contract)
  }
})

test("candidate queue keeps more than four open candidates reachable", () => {
  const candidates = read(
    "src/features/workspace/components/company-map-candidate-queue.tsx"
  )

  assert.match(candidates, /candidates\.map/)
  assert.match(candidates, /overflow-y-auto/)
  assert.doesNotMatch(candidates, /slice\(0,\s*4\)/)
})

test("reviewed candidates remain reachable without stretching the panel", () => {
  const candidates = read(
    "src/features/workspace/components/company-map-candidate-queue.tsx"
  )

  assert.match(candidates, /reviewedCandidates\.map/)
  assert.match(candidates, /max-h-72/)
  assert.match(candidates, /overflow-y-auto/)
  assert.doesNotMatch(candidates, /reviewedCandidates\.slice/)
})

test("pin edit closes only after successful save", () => {
  const pins = read("src/features/workspace/components/memory-pins-panel.tsx")
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  assert.match(
    pins,
    /await onEdit\(pin, draftContent\)[\s\S]*setEditingId\(null\)/
  )
  assert.match(pins, /keep the draft for retry/)
  assert.match(shell, /handleEditPin[\s\S]*throw actionError/)
})

test("workspace refreshes pins and Company Map after review mutations", () => {
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  for (const contract of [
    /const refreshCaptureState = useCallback[\s\S]*loadProjectCaptureData\(projectPublicId, \{[\s\S]*forceRefresh: true,[\s\S]*patchProjectGlobals\(/,
    /handleConfirmPin[\s\S]*await confirmPin\(projectPublicId, pin.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleEditPin[\s\S]*await updatePin\(projectPublicId, pin.public_id[\s\S]*await refreshCaptureState\(\)/,
    /handleArchivePin[\s\S]*await archivePin\(projectPublicId, pin.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handlePromotePin[\s\S]*await promotePin\(projectPublicId, pin.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleAcceptCandidate[\s\S]*await acceptCandidate\(projectPublicId, candidate.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleEditAcceptCandidate[\s\S]*await editAcceptCandidate\(projectPublicId, candidate.public_id, value\)[\s\S]*await refreshCaptureState\(\)/,
    /handleRejectCandidate[\s\S]*await rejectCandidate\(projectPublicId, candidate.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleArchiveCandidate[\s\S]*await archiveCandidate\(projectPublicId, candidate.public_id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleClarifyCandidate[\s\S]*await clarifyCandidate\(projectPublicId, candidate.public_id\)[\s\S]*await refreshCaptureState\(\)/,
  ]) {
    assert.match(shell, contract)
  }
})

test("workspace copy does not overclaim investor readiness", () => {
  const files = [
    "src/features/workspace/components/workspace-shell.tsx",
    "src/features/workspace/components/company-map-panel.tsx",
    "src/features/workspace/components/artifact-hub-panel.tsx",
    "src/features/workspace/components/artifact-inspector.tsx",
    "src/features/workspace/components/artifact-version-preview.tsx",
    "src/features/workspace/components/artifact-deck-preview.tsx",
    "src/features/workspace/components/artifact-version-history.tsx",
    "src/features/workspace/lib/generation-events.ts",
  ]

  for (const file of files) {
    assert.doesNotMatch(read(file), /investor-ready/i, file)
  }
})
