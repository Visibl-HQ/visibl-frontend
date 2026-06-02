"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AI_MEMORY_EXPORT_PROMPT,
  AI_MEMORY_EXPORT_STEPS,
} from "@/features/ingestion/data/ai-memory-export-prompt"
import { getImportPrompt } from "@/lib/api/ingestion"
import type { ImportPromptProvider, ImportPromptResponse } from "@/lib/api/types"

type ImportPromptBlockProps = {
  projectId: string
  provider?: ImportPromptProvider
  active?: boolean
  title?: string
  description?: string
}

export function ImportPromptBlock({
  projectId,
  provider = "generic",
  active = true,
  title = "Copy this prompt into your AI assistant",
  description = "Run it in ChatGPT, Claude, or another assistant you use. Paste the full response below when you're done.",
}: ImportPromptBlockProps) {
  const [prompts, setPrompts] = useState<
    Partial<Record<ImportPromptProvider, ImportPromptResponse>>
  >({})
  const [promptErrors, setPromptErrors] = useState<
    Partial<Record<ImportPromptProvider, string>>
  >({})
  const [copied, setCopied] = useState(false)

  const prompt = prompts[provider]
  const loadError = promptErrors[provider] ?? null
  const isLoading = active && prompt === undefined && loadError === null
  const promptText = prompt?.prompt_text.trim()
    ? prompt.prompt_text
    : AI_MEMORY_EXPORT_PROMPT
  const steps =
    prompt && prompt.steps.length > 0 ? prompt.steps : AI_MEMORY_EXPORT_STEPS

  useEffect(() => {
    if (!active || prompt !== undefined || loadError !== null) {
      return
    }

    let cancelled = false

    void getImportPrompt(projectId, provider)
      .then((response) => {
        if (!cancelled) {
          setPrompts((current) => ({ ...current, [provider]: response }))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPromptErrors((current) => ({
            ...current,
            [provider]:
              error instanceof Error
                ? error.message
                : "Could not load import prompt.",
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [active, loadError, projectId, prompt, provider])

  async function handleCopy() {
    await navigator.clipboard.writeText(promptText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          {description}
        </p>
        <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-4 text-xs leading-5">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="border-border/70 bg-muted/20 relative rounded-lg border">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading prompt…
          </div>
        ) : (
          <pre className="max-h-48 overflow-y-auto p-3 text-[11px] leading-5 whitespace-pre-wrap">
            {promptText}
          </pre>
        )}
        <div className="border-border/70 flex justify-end border-t px-2 py-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" />
                Copy prompt
              </>
            )}
          </Button>
        </div>
      </div>

      {loadError ? (
        <p className="text-muted-foreground text-xs">
          Using the default prompt. {loadError}
        </p>
      ) : null}
    </div>
  )
}
