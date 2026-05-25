"use client"

import { cn } from "@/lib/utils"
import { SectionLabel } from "@/components/marketing/section-label"
import { ChatComposer } from "@/features/workspace/components/chat-composer"
import {
  ChatThread,
  type ChatMessage,
} from "@/features/workspace/components/chat-thread"

type ChatPanelProps = {
  messages: ChatMessage[]
  activityLabel?: string | null
  isStreaming: boolean
  error?: string | null
  onSend: (content: string) => Promise<void>
  className?: string
}

export function ChatPanel({
  messages,
  activityLabel,
  isStreaming,
  error,
  onSend,
  className,
}: ChatPanelProps) {
  return (
    <section
      className={cn(
        "chat-panel-bg border-border/70 relative flex min-h-0 min-w-0 flex-col border-x",
        className
      )}
    >
      <div className="border-border/60 bg-background/70 flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">
        <div>
          <SectionLabel index="01">Intake</SectionLabel>
          <p className="text-muted-foreground text-xs">Streaming conversation</p>
        </div>
        <div className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 shrink-0 border-b px-4 py-2 text-sm sm:px-6"
        >
          {error}
        </div>
      ) : null}

      <ChatThread
        messages={messages}
        {...(activityLabel !== undefined ? { activityLabel } : {})}
      />
      <ChatComposer disabled={isStreaming} onSend={onSend} />
    </section>
  )
}
