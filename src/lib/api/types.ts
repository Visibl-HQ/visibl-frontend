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
  conversation_id: string
  pin_type: "metric" | "note"
  payload: MetricPinPayload | NotePinPayload
  is_archived: boolean
  source_message_id: string | null
  created_at: string
  updated_at: string
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

export type WorkspaceRead = {
  project: ProjectRead
  conversation: ConversationRead
  messages: MessageRead[]
  memory_pins: MemoryPinRead[]
  problem_customer_doc: ProblemCustomerDocRead
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
}

export type ApiErrorBody = {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>
}
