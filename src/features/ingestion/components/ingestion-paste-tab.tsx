"use client"

import { useState } from "react"
import { AlertCircle, Loader2, StickyNote, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImportPromptBlock } from "@/features/ingestion/components/import-prompt-block"
import type { SourceType } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type PasteMode = "notes" | "ai_memory"

type IngestionPasteTabProps = {
  projectId: string
  active?: boolean
  disabled?: boolean
  onSubmitPaste: (text: string, sourceType?: SourceType) => void | Promise<void>
}

const MODES: Array<{
  id: PasteMode
  label: string
  description: string
  icon: typeof StickyNote
}> = [
  {
    id: "notes",
    label: "Notes & research",
    description: "Interviews, docs, market notes, or copied context.",
    icon: StickyNote,
  },
  {
    id: "ai_memory",
    label: "AI memory export",
    description: "Export from ChatGPT, Claude, or similar, then paste here.",
    icon: Sparkles,
  },
]

export function IngestionPasteTab({
  projectId,
  active = true,
  disabled = false,
  onSubmitPaste,
}: IngestionPasteTabProps) {
  const [mode, setMode] = useState<PasteMode>("notes")
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = text.trim()

    if (!trimmed || disabled || isSubmitting) {
      return
    }

    setLocalError(null)
    setIsSubmitting(true)

    try {
      await onSubmitPaste(
        trimmed,
        mode === "ai_memory" ? "ai_memory_export" : "paste"
      )
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not import pasted text."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((item) => {
          const Icon = item.icon
          const isActive = mode === item.id

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => {
                setMode(item.id)
                setLocalError(null)
              }}
              className={cn(
                "border-border/70 hover:bg-muted/30 rounded-xl border px-3 py-3 text-left transition-colors",
                isActive && "border-brand/40 bg-brand/5 ring-brand/20 ring-1"
              )}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    isActive ? "text-brand" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {mode === "ai_memory" ? (
        <ImportPromptBlock
          projectId={projectId}
          active={active && mode === "ai_memory"}
        />
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="ingestion-paste">
          {mode === "ai_memory"
            ? "Paste the AI response here"
            : "Paste your notes or context"}
        </Label>
        <Textarea
          id="ingestion-paste"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            mode === "ai_memory"
              ? "Paste the full exported memory block from your AI assistant…"
              : "Customer interviews, research, competitor notes, onboarding docs…"
          }
          rows={mode === "ai_memory" ? 10 : 8}
          disabled={disabled || isSubmitting}
        />
      </div>

      {localError ? (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <p>{localError}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !text.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Extracting…
            </>
          ) : (
            "Extract preview"
          )}
        </Button>
      </div>
    </form>
  )
}
