import type { PotentialImpact } from "@/features/idea-history/types"

const IMPACT_RULES: Array<{
  pattern: RegExp
  field: string
  description: string
  severity: "medium" | "high"
}> = [
  {
    pattern: /\b(icp|customer|segment|who buys|target market)\b/i,
    field: "Target customer",
    description:
      "Could redefine who you serve and invalidate prior assumptions.",
    severity: "high",
  },
  {
    pattern: /\b(pric(e|ing)|willingness to pay|monetiz)\b/i,
    field: "Pricing & willingness to pay",
    description: "May shift revenue model or positioning in your story.",
    severity: "high",
  },
  {
    pattern: /\b(problem|pain|severity|urgency)\b/i,
    field: "Problem severity",
    description: "Could change how urgent or acute the problem reads.",
    severity: "medium",
  },
  {
    pattern: /\b(competitor|alternative|substitute|chatgpt)\b/i,
    field: "Competitive framing",
    description: "Might affect differentiation and risk pins.",
    severity: "medium",
  },
  {
    pattern: /\b(gtm|go-to-market|channel|distribution|sales)\b/i,
    field: "Go-to-market path",
    description: "Could open a different distribution strategy.",
    severity: "high",
  },
  {
    pattern: /\b(pivot|instead|what if|different tangent)\b/i,
    field: "Strategic direction",
    description: "Sounds like a fork — worth a branch, not the main thread.",
    severity: "high",
  },
]

export function inferPotentialImpacts(question: string): PotentialImpact[] {
  const matches = IMPACT_RULES.filter((rule) => rule.pattern.test(question))

  if (matches.length === 0) {
    return [
      {
        field: "General strategy",
        description:
          "This question could shift framing in pins or the problem doc if pursued in your official story.",
        severity: "medium",
      },
    ]
  }

  const seen = new Set<string>()

  return matches
    .filter((match) => {
      if (seen.has(match.field)) {
        return false
      }

      seen.add(match.field)
      return true
    })
    .map((match) => ({
      field: match.field,
      description: match.description,
      severity: match.severity,
    }))
}

export function buildOneOffAssistantReply(
  question: string,
  impacts: PotentialImpact[]
): string {
  const fields = impacts.map((impact) => impact.field.toLowerCase()).join(", ")

  return (
    `Explored separately — nothing in your official story has changed yet.\n\n` +
    `If you pursued this in your main line, it could affect ${fields}. ` +
    `You can dismiss this, commit your current work and open a branch, or keep exploring here without touching pins or the doc.`
  )
}
