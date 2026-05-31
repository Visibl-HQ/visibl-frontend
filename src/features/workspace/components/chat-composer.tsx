"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MIN_HEIGHT = 44
const MAX_HEIGHT = 168

type ChatComposerProps = {
  disabled?: boolean
  onSend: (content: string) => Promise<void>
  onExploreSeparately?: () => void
  className?: string
}

export function ChatComposer({
  disabled = false,
  onSend,
  onExploreSeparately,
  className,
}: ChatComposerProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    const nextHeight = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, textarea.scrollHeight)
    )
    textarea.style.height = `${nextHeight}px`
  }, [content])

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
    <div className={cn("shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6", className)}>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "border-border/70 bg-card/50 focus-within:border-border flex items-end gap-2 rounded-[1.4rem] border px-3 py-2 shadow-sm",
            disabled && "opacity-70"
          )}
        >
          <label htmlFor="workspace-chat-input" className="sr-only">
            Message the assistant
          </label>
          <textarea
            ref={textareaRef}
            id="workspace-chat-input"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Ask anything about your startup…"
            rows={1}
            disabled={disabled || isSubmitting}
            className="placeholder:text-muted-foreground/60 max-h-[168px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-6 outline-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={isSendDisabled}
            aria-label="Send message"
            className="mb-0.5 size-8 shrink-0 rounded-full"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px]">
          <span>
            Visibl can make mistakes. Verify important claims before sharing.
          </span>
          {onExploreSeparately ? (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onExploreSeparately}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                <Sparkles className="size-3" aria-hidden="true" />
                Explore a tangent separately
              </button>
            </>
          ) : null}
        </p>
      </form>
    </div>
  )
}
