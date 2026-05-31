"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/features/workspace/components/chat-thread"
import { cn } from "@/lib/utils"

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
      className="bg-foreground/70 ml-0.5 inline-block h-[1em] w-px animate-pulse align-text-bottom"
    />
  )
}

function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground size-7"
        aria-label={copied ? "Copied" : "Copy message"}
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"
  const timestamp = formatMessageTime(message.created_at)
  const hasContent = Boolean(message.content) || message.isStreaming

  if (isUser) {
    return (
      <article className="group flex justify-end">
        <div className="max-w-[min(88%,32rem)]">
          <div className="bg-muted/70 rounded-2xl px-4 py-2.5 text-sm leading-6">
            <p className="[overflow-wrap:anywhere] break-words whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <time
              dateTime={message.created_at}
              className="text-muted-foreground text-[11px]"
            >
              {timestamp}
            </time>
            <MessageActions content={message.content} />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group min-w-0">
      <div className="min-w-0 text-sm leading-7">
        {hasContent ? (
          <div
            className={cn(
              "[overflow-wrap:anywhere] break-words whitespace-pre-wrap",
              message.isStreaming && "pb-0.5"
            )}
          >
            {message.content}
            {message.isStreaming ? <StreamingCursor /> : null}
          </div>
        ) : message.isStreaming ? (
          <p className="text-muted-foreground">…</p>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <time
          dateTime={message.created_at}
          className="text-muted-foreground text-[11px]"
        >
          {timestamp}
        </time>
        {message.isStreaming ? (
          <span className="text-muted-foreground text-[11px]">Writing</span>
        ) : null}
        {message.content ? <MessageActions content={message.content} /> : null}
      </div>
    </article>
  )
}
