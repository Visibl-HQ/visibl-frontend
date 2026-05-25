"use client"

import { cn } from "@/lib/utils"
import { AssistantMark } from "@/features/workspace/components/assistant-mark"
import type { ChatMessage } from "@/features/workspace/components/chat-thread"

type ChatMessageBubbleProps = {
  message: ChatMessage
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function StreamingCursor() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse"
    />
  )
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"
  const timestamp = formatMessageTime(message.created_at)

  if (isUser) {
    return (
      <article className="flex justify-end">
        <div className="max-w-[min(78%,42rem)]">
          <div className="mb-1.5 flex items-center justify-end gap-2">
            <time
              dateTime={message.created_at}
              className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase"
            >
              {timestamp}
            </time>
            <span className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
              You
            </span>
          </div>
          <div className="bg-foreground text-background rounded-lg rounded-br-sm px-4 py-3 text-sm leading-7 shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex gap-3">
      <AssistantMark className="mt-7 hidden sm:block" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
            Visibl · Intake
          </span>
          <span
            className="bg-border hidden h-3 w-px sm:block"
            aria-hidden="true"
          />
          <time
            dateTime={message.created_at}
            className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase"
          >
            {timestamp}
          </time>
          {message.isStreaming ? (
            <span className="text-brand font-mono text-[10px] tracking-[0.16em] uppercase">
              Streaming
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "border-border/70 bg-card/90 relative overflow-hidden rounded-xl border px-4 py-3.5 shadow-sm backdrop-blur-sm",
            message.isStreaming && "border-brand/25"
          )}
        >
          <div
            aria-hidden="true"
            className="bg-brand absolute inset-y-3 left-0 w-[2px] rounded-full"
          />
          <div className="pl-2">
            {message.content || message.isStreaming ? (
              <p className="text-sm leading-7 whitespace-pre-wrap">
                {message.content}
                {message.isStreaming ? <StreamingCursor /> : null}
              </p>
            ) : null}
            {!message.content && message.isStreaming ? (
              <p className="text-muted-foreground text-sm leading-7">
                Composing response
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
