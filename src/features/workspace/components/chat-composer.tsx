"use client"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChatComposerProps = {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
  className?: string
}

export function ChatComposer({
  disabled = false,
  onSend,
  className,
}: ChatComposerProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = content.trim()

    if (!trimmed || disabled || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setContent("")

    try {
      await onSend(trimmed)
    } catch {
      setContent(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSendDisabled = disabled || isSubmitting || !content.trim()

  return (
    <div
      className={cn(
        "border-border/60 bg-background/90 shrink-0 border-t px-4 py-4 backdrop-blur-xl sm:px-6",
        className
      )}
    >
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "border-border/70 bg-card/80 focus-within:border-brand/40 focus-within:ring-brand/15 rounded-lg border p-2 shadow-sm focus-within:ring-2",
            disabled && "opacity-70"
          )}
        >
          <label htmlFor="workspace-chat-input" className="sr-only">
            Message the intake assistant
          </label>
          <textarea
            id="workspace-chat-input"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe your customer, problem, or latest insight…"
            rows={3}
            disabled={disabled || isSubmitting}
            className="placeholder:text-muted-foreground/70 min-h-20 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Enter to send · Shift+Enter for newline
            </p>
            <Button
              type="submit"
              size="icon-sm"
              disabled={isSendDisabled}
              aria-label="Send message"
              className="rounded-md"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
