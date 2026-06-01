import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const root = new URL("../", import.meta.url)

function read(path) {
  return readFileSync(new URL(path, root), "utf8")
}

test("workspace exposes Company Map and Artifact Hub as primary modes", () => {
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  assert.match(shell, /Company Map/)
  assert.match(shell, /Artifact Hub/)
  assert.match(shell, /role="tablist"/)
  assert.match(shell, /<CompanyMapPanel/)
  assert.match(shell, /<ArtifactHubPanel/)
  assert.match(shell, /<WorkspaceContextSidebarContent/)
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
  assert.match(hub, /Preview placeholder/)
  assert.match(hub, /Generation\/export disabled/)
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

  for (const contract of [
    /onAccept/,
    /onEditAccept/,
    /onReject/,
    /onArchive/,
    /onClarify/,
    /Reviewed candidates/,
    /source_document_id/,
    /source_document_label/,
    /Open chat context/,
    /Contradiction/,
  ]) {
    assert.match(candidates, contract)
  }
})

test("workspace refreshes pins and Company Map after review mutations", () => {
  const shell = read("src/features/workspace/components/workspace-shell.tsx")

  for (const contract of [
    /const refreshCaptureState = useCallback[\s\S]*listPins\(projectId\)[\s\S]*getCompanyMap\(projectId\)[\s\S]*listArtifacts\(projectId\)/,
    /refreshCaptureState[\s\S]*artifact_hub: nextArtifactHub/,
    /handleConfirmPin[\s\S]*await confirmPin\(projectId, pin.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleEditPin[\s\S]*await updatePin\(projectId, pin.id[\s\S]*await refreshCaptureState\(\)/,
    /handleArchivePin[\s\S]*await archivePin\(projectId, pin.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handlePromotePin[\s\S]*await promotePin\(projectId, pin.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleAcceptCandidate[\s\S]*await acceptCandidate\(projectId, candidate.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleEditAcceptCandidate[\s\S]*await editAcceptCandidate\(projectId, candidate.id, value\)[\s\S]*await refreshCaptureState\(\)/,
    /handleRejectCandidate[\s\S]*await rejectCandidate\(projectId, candidate.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleArchiveCandidate[\s\S]*await archiveCandidate\(projectId, candidate.id\)[\s\S]*await refreshCaptureState\(\)/,
    /handleClarifyCandidate[\s\S]*await clarifyCandidate\(projectId, candidate.id\)[\s\S]*await refreshCaptureState\(\)/,
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
  ]

  for (const file of files) {
    assert.doesNotMatch(read(file), /investor-ready/i, file)
  }
})
