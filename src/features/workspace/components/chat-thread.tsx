"use client"

import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import { SectionLabel } from "@/components/marketing/section-label"
import { cn } from "@/lib/utils"
import { ChatMessageBubble } from "@/features/workspace/components/chat-message-bubble"
import type { MessageRead } from "@/lib/api/types"

export type ChatMessage = MessageRead & {
  isStreaming?: boolean
}

type ChatThreadProps = {
  messages: ChatMessage[]
  activityLabel?: string | null
  className?: string
}

export function ChatThread({ messages, activityLabel, className }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, activityLabel])

  return (
    <div
      data-lenis-prevent
      className={cn(
        "chat-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          {messages.length === 0 ? (
            <div className="border-border/60 bg-card/40 flex flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center">
              <span className="border-border/70 bg-background grid size-11 place-items-center rounded-md border">
                <Sparkles className="text-brand size-5" aria-hidden="true" />
              </span>
              <SectionLabel index="01" className="mt-5">
                Intake session
              </SectionLabel>
              <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">
                Start the conversation
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm leading-7">
                Share what you are building, who it is for, and what you have learned so far.
                Memory pins and your problem-and-customer doc update as you talk.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))
          )}

          {activityLabel ? (
            <div
              className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase"
              aria-live="polite"
            >
              <span className="bg-brand size-1.5 animate-pulse rounded-full" aria-hidden="true" />
              {activityLabel}
            </div>
          ) : null}

          <div ref={bottomRef} className="h-px shrink-0" />
        </div>
    </div>
  )
}
