import type {
  ChecklistSectionKey,
  ConversationRead,
  ProblemCustomerDocRead,
  ProjectRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { DRAFT_CONVERSATION_ID } from "@/features/workspace/lib/conversation-routing"

const CHECKLIST_SECTION_KEYS: ChecklistSectionKey[] = [
  "target_customer",
  "customer_problem",
  "problem_severity",
  "current_workaround",
  "why_now",
  "customer_access",
  "willingness_to_pay",
  "early_validation",
]

export function createEmptyProblemCustomerDoc(
  conversationId: string
): ProblemCustomerDocRead {
  const now = new Date().toISOString()

  return {
    id: "draft-doc",
    conversation_id: conversationId,
    checklist: {
      sections: Object.fromEntries(
        CHECKLIST_SECTION_KEYS.map((key) => [key, { done: false, summary: "" }])
      ) as Record<ChecklistSectionKey, { done: boolean; summary: string }>,
    },
    completion_percentage: 0,
    created_at: now,
    updated_at: now,
  }
}

export function createDraftConversation(projectId: string): ConversationRead {
  const now = new Date().toISOString()

  return {
    id: DRAFT_CONVERSATION_ID,
    project_id: projectId,
    title: null,
    status: "active",
    created_at: now,
    updated_at: now,
  }
}

export function createDraftWorkspace(project: ProjectRead): WorkspaceRead {
  return {
    project,
    conversation: createDraftConversation(project.id),
    messages: [],
    memory_pins: [],
    problem_customer_doc: createEmptyProblemCustomerDoc(DRAFT_CONVERSATION_ID),
    user_display_name: "",
  }
}
