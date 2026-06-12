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
  public_id: string
  name: string
  current_goal: string | null
  current_stage: string | null
  target_outcome: string | null
  deadline_at: string | null
  created_at: string
  updated_at: string
}

export type ProjectSummaryRead = {
  public_id: string
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
  public_id: string
  project_public_id: string
  title: string | null
  status: "active" | "archived"
  created_at: string
  updated_at: string
}

export type MessageRead = {
  public_id: string
  conversation_public_id: string
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
  public_id: string
  conversation_public_id: string
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
  source_message_public_id: string | null
  source_document_id: string | null
  source_document_label: string | null
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
  pin_public_id: string | null
  message_public_id: string | null
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
  project_public_id: string
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
  public_id: string
  project_public_id: string
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
  source_pin_public_id: string | null
  source_message_public_id: string | null
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

// Honest internal labels (goal-011): exports and share-safety do not exist
// yet, so readiness never claims "Ready for PPT" / "Ready to share".
export type ArtifactReadiness =
  | "Collecting"
  | "Draftable"
  | "Version-ready"
  | "Source-ready"
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

export type ArtifactSourceRef = {
  id: string
  label: string
  source_type: string
  pin_public_id: string | null
  message_public_id: string | null
  document_id: string | null
  document_label: string | null
  summary: string
}

export type ArtifactContentSection = {
  id: string
  label: string
  field_key: string
  value: string
  support_label: FieldSupportLabel
  source_refs: ArtifactSourceRef[]
  caveats: string[]
}

export type ArtifactDeckSlide = {
  id: string
  title: string
  section_ids: string[]
  speaker_notes: string
}

export type ArtifactGenerationMetadata = {
  template_version: string
  prompt_version: string
  schema_version: number
  model: string
  generator: "llm" | "deterministic_fallback"
  fallback_reason?: string
  source_snapshot_schema_version: number
}

export type ArtifactVersionContent = {
  schema_version: number
  artifact_id: string
  title: string
  summary: string
  source_snapshot_id: string
  source_scope: string
  sections: ArtifactContentSection[]
  slides?: ArtifactDeckSlide[]
  caveats: string[]
  generation_metadata: ArtifactGenerationMetadata
}

export type ArtifactVersionRead = {
  public_id: string
  artifact_id: string
  version_number: number
  created_at: string
  dependency_hash: string
  is_stale: boolean
  stale_reason: string | null
  content_schema_version: number
  content: ArtifactVersionContent
  rendered_markdown: string | null
  generation_label: string
  share_safety_status: string
  created_by_kind: string
}

export type ArtifactVersionPage = {
  items: ArtifactVersionRead[]
  next_cursor: string | null
}

export type GenerationJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"

export type GenerationJobEventRead = {
  event_type: string
  message: string
  payload: Record<string, unknown>
  created_at: string
}

export type GenerationJobRead = {
  public_id: string
  project_public_id: string
  job_type: string
  status: GenerationJobStatus
  artifact_id: string | null
  attempt_count: number
  progress: number
  poll_interval_ms: number
  safe_error: string | null
  metadata_json: Record<string, unknown>
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  result_version: ArtifactVersionRead | null
  events: GenerationJobEventRead[]
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
  minimum_draft_field_keys: string[]
  minimum_draft_satisfied_count: number
  next_best_action: NextBestAction
  blockers: ArtifactBlockerRead[]
  required_field_keys: string[]
  evidence: EvidenceRead[]
  generation_disabled_reason: string | null
  export_disabled_reason: string
}

export type ArtifactHubRead = {
  project_public_id: string
  artifacts: ArtifactRead[]
}

export type HostedPageStatus =
  | "draft"
  | "private_share"
  | "gated"
  | "public"
  | "archived"

export type HostedPageVisibility = "hidden" | "summary" | "full"

export type HostedPageArtifactSelection = {
  artifact_id: string
  artifact_version_id: string
  visibility: HostedPageVisibility
}

export type HostedPageVisibilityConfig = {
  target_status: HostedPageStatus
  fields: Record<string, HostedPageVisibility>
  artifacts: HostedPageArtifactSelection[]
  allow_weak_private_claims?: boolean
}

export type ShareBlockerRead = {
  id: string
  scope: "field" | "artifact" | "page"
  severity: "info" | "medium" | "high"
  message: string
  field_key: string | null
  artifact_id: string | null
  artifact_version_id: string | null
}

export type ShareSafetyReportRead = {
  allowed: boolean
  status: "pass" | "needs_review" | "blocked"
  target_status: HostedPageStatus
  blockers: ShareBlockerRead[]
  source_dependency_hash: string | null
}

export type HostedPageRevisionRead = {
  public_id: string
  version_number: number
  status: HostedPageStatus
  source_dependency_hash: string
  visibility_config: HostedPageVisibilityConfig
  share_safety_report: ShareSafetyReportRead
  created_at: string
}

export type HostedPageRead = {
  public_id: string
  project_public_id: string
  slug: string
  status: HostedPageStatus
  cta_text: string | null
  contact_method: string | null
  gate_config_json: Record<string, unknown>
  current_revision: HostedPageRevisionRead | null
  current_revision_stale: boolean
  public_url_path: string | null
}

export type HostedPagePreviewRead = {
  share_safety: ShareSafetyReportRead
  projection: HostedPageProjection | null
}

export type HostedPagePublishRead = {
  page: HostedPageRead
  share_token: string | null
}

export type HostedPageAnalyticsSummaryRead = {
  page_views: number
  cta_clicks: number
  artifact_downloads: number
  feedback_count: number
  latest_objections: string[]
}

export type HostedPageFeedbackRead = {
  public_id: string
  page_public_id: string
  revision_public_id: string
  feedback_type: "comment" | "objection" | "intro_request" | "question"
  body: string
  contact_email: string | null
  triage_status: "new" | "linked" | "dismissed"
  metadata_json: Record<string, unknown>
  created_at: string
}

export type HostedPageFeedbackLinkRead = {
  feedback: HostedPageFeedbackRead
  candidate_public_id: string | null
}

export type HostedPageProjectionField = {
  key: string
  label: string
  value: string | null
  summary: string | null
  visibility: HostedPageVisibility
  support_label: FieldSupportLabel
}

export type HostedPageProjectionSection = {
  id: string
  label: string
  field_key: string
  value: string
  support_label: FieldSupportLabel
}

export type HostedPageProjectionArtifact = {
  artifact_id: string
  artifact_version_number: number
  visibility: HostedPageVisibility
  title: string
  summary: string
  sections: HostedPageProjectionSection[]
}

export type HostedPageProjection = {
  schema_version: number
  target_status: HostedPageStatus
  fields: HostedPageProjectionField[]
  artifacts: HostedPageProjectionArtifact[]
  page?: {
    public_id: string
    slug: string
    cta_text: string | null
    contact_method: string | null
  }
}

export type HostedPagePublicRead = {
  public_id: string
  slug: string
  status: HostedPageStatus
  revision_public_id: string
  projection: HostedPageProjection
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
  user_message_public_id: string
  problem_customer_doc: ProblemCustomerDocRead
  memory_pins: MemoryPinRead[]
  company_map: CompanyMapRead
}

export type ApiErrorPayload = {
  code: string
  message: string
  request_id: string
}

export type ApiErrorBody = {
  detail?: string | Array<{ loc: string[]; msg: string; type: string }>
  error?: ApiErrorPayload
}

export type BranchStatus = "active" | "merged" | "abandoned"

export type BranchRead = {
  public_id: string
  name: string
  created_at: string
  forked_from_checkpoint_public_id: string | null
  parent_branch_public_id: string
  head_checkpoint_public_id: string | null
  status: BranchStatus
}

export type CheckpointRead = {
  public_id: string
  branch_public_id: string
  conversation_public_id: string
  title: string
  note: string | null
  created_at: string
  pins_snapshot: MemoryPinRead[]
  doc_snapshot: ProblemCustomerDocRead
  message_count: number
  parent_checkpoint_public_id: string | null
  is_merge: boolean
}

export type ConversationBindingRead = {
  conversation_public_id: string
  branch_public_id: string
  base_checkpoint_public_id: string | null
  last_checkpoint_public_id: string | null
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
  public_id: string
  question: string
  messages: OneOffMessageRead[]
  potential_impacts: PotentialImpactRead[]
  fork_checkpoint_public_id: string | null
  conversation_public_id: string
  created_at: string
}

export type IdeaHistoryBootstrapRead = {
  version: 1
  main_branch_public_id: string
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

export type SourceType =
  | "file_upload"
  | "paste"
  | "ai_memory_export"
  | "chatgpt_export"
  | "claude_export"
  | "startup_notes"

export type ExtractionJobStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"

export type UploadUrlRequest = {
  filename: string
  content_type: string
  conversation_id: string
}

export type UploadUrlResponse = {
  source_item_id: string
  upload_url: string
  file_key: string
}

export type CreateSourceItemBody = {
  conversation_id: string
  source_type: SourceType
  source_item_id?: string
  file_key?: string
  byte_size?: number
  original_filename?: string
  mime_type?: string
  paste_text?: string
  export_conversation_id?: string
  origin_metadata?: Record<string, unknown>
}

export type EnqueueJobResponse = {
  job_id: string
  status: ExtractionJobStatus
}

export type ProposedPin = {
  pin_type: "metric" | "note"
  value?: string | null
  label?: string | null
  content?: string | null
}

export type ProposedDocSection = {
  section: ChecklistSectionKey
  done: boolean
  summary: string
}

export type IngestionPreview = {
  proposed_pins: ProposedPin[]
  proposed_doc_sections: ProposedDocSection[]
  summary: string
  confidence: "high" | "medium" | "low"
}

export type ExtractionJobRead = {
  public_id: string
  project_public_id: string
  source_item_public_id: string
  status: ExtractionJobStatus
  preview: IngestionPreview | null
  failure_reason: string | null
  attempt_count: number
  model_used: string | null
  applied_at: string | null
  poll_interval_ms: number
  created_at: string
  updated_at: string
}

export type ApplyIngestionResponse = {
  job_id: string
  applied_at: string
  pins_created: number
  doc_sections_updated: number
  memory_pins: MemoryPinRead[]
  problem_customer_doc: ProblemCustomerDocRead
}

export type ExportConversationOption = {
  id: string
  title: string
  message_count: number
  transcript_markdown: string
}

export type ParseExportResponse = {
  provider: "chatgpt" | "claude"
  conversations: ExportConversationOption[]
}

export type ImportPromptResponse = {
  provider: string
  prompt_text: string
  steps: string[]
}

export type ExportProvider = "chatgpt" | "claude"

export type ImportPromptProvider = ExportProvider | "generic" | "ai_memory"
