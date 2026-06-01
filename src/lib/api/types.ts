export type RoleRead = {
  id: string
  name: string
  description: string
}

export type UserProfile = {
  id: string
  email: string
  username: string
  is_active: boolean
  created_at: string
  role: RoleRead
}

export type RefreshResponse = {
  status: string
  user_id: string
}

export type ProjectRead = {
  id: string
  owner_user_id: string
  name: string
  current_goal: string | null
  current_stage: string | null
  target_outcome: string | null
  deadline_at: string | null
  created_at: string
  updated_at: string
}

export type ProjectSummaryRead = {
  id: string
  name: string
  current_stage: string | null
  current_goal: string | null
  created_at: string
  updated_at: string
  conversation_count: number
}

export type CursorPage<T> = {
  items: T[]
  next_cursor: string | null
}

export type ConversationRead = {
  id: string
  project_id: string
  title: string | null
  status: "active" | "archived"
  created_at: string
  updated_at: string
}

export type MessageRead = {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  sequence: number
  created_at: string
}

export type MetricPinPayload = {
  value: string
  label: string
}

export type NotePinPayload = {
  content: string
}

export type MemoryPinRead = {
  id: string
  project_id: string | null
  conversation_id: string
  pin_type:
    | "fact"
    | "founder_claim"
    | "metric"
    | "customer_quote"
    | "validation_signal"
    | "assumption"
    | "risk"
    | "insight"
    | "investor_objection"
    | "contradiction"
    | "decision"
    | "open_question"
    | "task"
    | "source_reference"
    | "artifact_relevant_claim"
    | "note"
  payload: MetricPinPayload | NotePinPayload
  is_archived: boolean
  status: "suggested" | "confirmed" | "edited" | "promoted" | "archived"
  title: string | null
  content: string | null
  field_key: string | null
  source_message_id: string | null
  source_document_id: string | null
  source_document_label: string | null
  source_fingerprint: string | null
  created_at: string
  updated_at: string
}

export type MemoryPinUpdate = {
  pin_type?: MemoryPinRead["pin_type"]
  title?: string | null
  content?: string | null
  payload?: Record<string, unknown>
  field_key?: string | null
}

export type ChecklistSectionKey =
  | "target_customer"
  | "customer_problem"
  | "problem_severity"
  | "current_workaround"
  | "why_now"
  | "customer_access"
  | "willingness_to_pay"
  | "early_validation"

export type ChecklistSection = {
  done: boolean
  summary: string
}

export type ProblemCustomerDocRead = {
  id: string
  conversation_id: string
  checklist: {
    sections: Record<ChecklistSectionKey, ChecklistSection>
  }
  completion_percentage: number
  created_at: string
  updated_at: string
}

export type FieldSupportLabel =
  | "Missing"
  | "Weak"
  | "Supported"
  | "Share-safe"
  | "Contradicted"

export type EvidenceRead = {
  id: string
  label: string
  detail: string
  source_type: string
  pin_id: string | null
  message_id: string | null
  document_id: string | null
  document_label: string | null
}

export type FieldBlockerRead = {
  id: string
  message: string
  severity: string
  next_action: string
}

export type CompanyMapFieldRead = {
  key: string
  label: string
  value: string | null
  support_label: FieldSupportLabel
  evidence: EvidenceRead[]
  blockers: FieldBlockerRead[]
  stale: boolean
  stale_reason: string | null
  next_action: string
  revision_id: string | null
  candidate_count: number
  contradiction_count: number
}

export type CompanyMapGroupRead = {
  key: string
  label: string
  description: string
  fields: CompanyMapFieldRead[]
}

export type CompanyMapRead = {
  project_id: string
  groups: CompanyMapGroupRead[]
  candidates: CompanyMapCandidateRead[]
  reviewed_candidates: CompanyMapCandidateRead[]
  capture_receipt: CaptureReceiptRead | null
}

export type CaptureReceiptRead = {
  pin_count: number
  candidate_count: number
  contradiction_count: number
  processing_state: "processed" | "processing"
}

export type CompanyMapCandidateRead = {
  id: string
  project_id: string
  field_key: string
  field_label: string
  suggested_value: string
  rationale: string
  status:
    | "suggested"
    | "needs_clarification"
    | "accepted"
    | "rejected"
    | "archived"
  is_conflict: boolean
  conflict_summary: string | null
  source_pin_id: string | null
  source_message_id: string | null
  source_document_id: string | null
  source_document_label: string | null
  source_fingerprint: string
  baseline_revision_id: string | null
  edited_value: string | null
  clarification_question: string | null
  accepted_revision_id: string | null
  created_at: string
  updated_at: string
}

export type ArtifactReadiness =
  | "Collecting"
  | "Draftable"
  | "Source-ready"
  | "Version-ready"
  | "Share review required"

export type SourceStrengthLabel =
  | "Missing"
  | "Weak"
  | "Mixed"
  | "Supported"
  | "Strong"

export type ArtifactSourceStrength = {
  label: SourceStrengthLabel
  supported_fields: number
  weak_fields: number
  missing_fields: number
  contradicted_fields: number
  total_fields: number
}

export type ArtifactStaleStatus = {
  is_stale: boolean
  label: string
  reason: string | null
}

export type NextBestAction = {
  label: string
  field_key: string | null
  blocker_id: string | null
}

export type ArtifactBlockerRead = {
  id: string
  scope: "field" | "artifact"
  message: string
  severity: string
  field_key: string | null
  next_action: NextBestAction
}

export type ArtifactVersionState = {
  label: string
  detail: string | null
}

export type ArtifactContentSection = {
  id: string
  label: string
  field_key: string
  value: string
  support_label: FieldSupportLabel
  source_refs: {
    id: string
    label: string
    source_type: string
    pin_id: string | null
    message_id: string | null
    document_id: string | null
    document_label: string | null
    summary: string
  }[]
  caveats: string[]
}

export type ArtifactVersionContent = {
  schema_version: number
  artifact_id: string
  title: string
  summary: string
  source_snapshot_id: string
  source_scope: string
  sections: ArtifactContentSection[]
  caveats: string[]
}

export type ArtifactVersionRead = {
  id: string
  artifact_id: string
  version_number: number
  created_at: string
  source_snapshot_id: string
  readiness_snapshot_id: string | null
  dependency_hash: string
  is_stale: boolean
  stale_reason: string | null
  content_schema_version: number
  content: ArtifactVersionContent
  rendered_markdown: string | null
  generation_label: string
  share_safety_status: string
  created_by_kind: string
  created_by_user_id: string | null
}

export type ArtifactRead = {
  id: string
  name: string
  description: string
  readiness: ArtifactReadiness
  source_strength: ArtifactSourceStrength
  blocker_count: number
  stale_status: ArtifactStaleStatus
  version_state: ArtifactVersionState | null
  current_version: ArtifactVersionRead | null
  can_create_version: boolean
  create_version_disabled_reason: string | null
  next_best_action: NextBestAction
  blockers: ArtifactBlockerRead[]
  required_field_keys: string[]
  evidence: EvidenceRead[]
  generation_disabled_reason: string
  export_disabled_reason: string
}

export type ArtifactHubRead = {
  project_id: string
  artifacts: ArtifactRead[]
}

export type WorkspaceRead = {
  project: ProjectRead
  conversation: ConversationRead
  messages: MessageRead[]
  memory_pins: MemoryPinRead[]
  problem_customer_doc: ProblemCustomerDocRead
  company_map: CompanyMapRead
  artifact_hub: ArtifactHubRead
  user_display_name: string
}

export type CreateProjectBody = {
  name: string
  current_goal?: string
  current_stage?: string
  target_outcome?: string
  deadline_at?: string
}

export type CreateConversationBody = {
  title?: string | null
}

export type ChatDonePayload = {
  assistant_message_id: string
  user_message_id: string
  problem_customer_doc: ProblemCustomerDocRead
  memory_pins: MemoryPinRead[]
  company_map: CompanyMapRead
}

export type ApiErrorBody = {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>
}

export type BranchStatus = "active" | "merged" | "abandoned"

export type BranchRead = {
  id: string
  name: string
  created_at: string
  forked_from_checkpoint_id: string | null
  parent_branch_id: string
  head_checkpoint_id: string | null
  status: BranchStatus
}

export type CheckpointRead = {
  id: string
  branch_id: string
  conversation_id: string
  title: string
  note: string | null
  created_at: string
  pins_snapshot: MemoryPinRead[]
  doc_snapshot: ProblemCustomerDocRead
  message_count: number
  parent_checkpoint_id: string | null
}

export type ConversationBindingRead = {
  conversation_id: string
  branch_id: string
  base_checkpoint_id: string | null
  last_checkpoint_id: string | null
}

export type PotentialImpactRead = {
  field: string
  description: string
  severity: "medium" | "high"
}

export type OneOffMessageRead = {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export type OneOffSessionRead = {
  id: string
  question: string
  messages: OneOffMessageRead[]
  potential_impacts: PotentialImpactRead[]
  fork_checkpoint_id: string | null
  conversation_id: string
  created_at: string
}

export type IdeaHistoryBootstrapRead = {
  version: 1
  main_branch_id: string
  branches: BranchRead[]
  checkpoints: CheckpointRead[]
  conversation_bindings: ConversationBindingRead[]
  one_off_sessions: OneOffSessionRead[]
}

export type DirtyChangeRead = {
  kind: "pin" | "doc" | "message"
  label: string
  detail?: string
}

export type ConversationHistoryStatusRead = {
  is_dirty: boolean
  dirty_changes: DirtyChangeRead[]
  can_branch: boolean
  can_merge: boolean
  active_branch: BranchRead
  head_checkpoint: CheckpointRead | null
}

export type BindingRestoreRead = {
  memory_pins: MemoryPinRead[]
  problem_customer_doc: ProblemCustomerDocRead
}

export type BindingUpdateResponse = {
  binding: ConversationBindingRead
  checkpoint: CheckpointRead | null
  restore: BindingRestoreRead
}

export type MergeBranchResponse = {
  merge_checkpoint: CheckpointRead
  main_branch: BranchRead
  merged_branch: BranchRead
  binding: ConversationBindingRead
  restore: BindingRestoreRead
}

export type CreateCheckpointBody = {
  branch_id: string
  conversation_id: string
  title: string
  note?: string
  message_count?: number
}

export type CreateBranchBody = {
  name: string
  from_checkpoint_id: string
  conversation_id: string
}

export type CreateBranchResponse = {
  branch: BranchRead
  binding: ConversationBindingRead
  restore: BindingRestoreRead
}

export type UpdateBindingBody = {
  branch_id: string
  checkpoint_id?: string | null
}

export type CreateOneOffBody = {
  question: string
  fork_checkpoint_id: string | null
  conversation_id: string
}

export type SendOneOffMessageBody = {
  content: string
}

export type MergeBranchBody = {
  conversation_id: string
}
