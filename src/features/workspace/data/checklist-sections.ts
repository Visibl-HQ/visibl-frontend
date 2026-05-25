import type { ChecklistSectionKey } from "@/lib/api/types"

export const CHECKLIST_SECTIONS: Array<{
  key: ChecklistSectionKey
  label: string
}> = [
  { key: "target_customer", label: "Target customer" },
  { key: "customer_problem", label: "Customer problem" },
  { key: "problem_severity", label: "Problem severity" },
  { key: "current_workaround", label: "Current workaround" },
  { key: "why_now", label: "Why now" },
  { key: "customer_access", label: "Customer access" },
  { key: "willingness_to_pay", label: "Willingness to pay" },
  { key: "early_validation", label: "Early validation" },
]
