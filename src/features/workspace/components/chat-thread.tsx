"use client"

import { useEffect, useRef } from "react"
import { FileUp, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChatMessageBubble } from "@/features/workspace/components/chat-message-bubble"
import type { MessageRead } from "@/lib/api/types"

export type ChatMessage = MessageRead & {
  isStreaming?: boolean
}

type ChatThreadProps = {
  messages: ChatMessage[]
  activityLabel?: string | null
  onOpenIngestion?: () => void
  className?: string
}

const STICKY_BOTTOM_THRESHOLD_PX = 96

function isNearBottom(element: HTMLElement): boolean {
  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight

  return distanceFromBottom <= STICKY_BOTTOM_THRESHOLD_PX
}

export function ChatThread({
  messages,
  activityLabel,
  onOpenIngestion,
  className,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageCountRef = useRef(messages.length)
  const shouldStickToBottomRef = useRef(true)

  useEffect(() => {
    const scrollElement = scrollRef.current
    const bottomElement = bottomRef.current

    if (!scrollElement || !bottomElement) {
      return
    }

    const messageCountChanged = messages.length !== messageCountRef.current
    messageCountRef.current = messages.length

    const isStreaming = messages.some((message) => message.isStreaming)

    if (messageCountChanged) {
      shouldStickToBottomRef.current = true
    }

    if (!shouldStickToBottomRef.current && !isNearBottom(scrollElement)) {
      return
    }

    shouldStickToBottomRef.current = true

    bottomElement.scrollIntoView({
      behavior: messageCountChanged && !isStreaming ? "smooth" : "auto",
      block: "end",
    })
  }, [messages, activityLabel])

  return (
    <div
      ref={scrollRef}
      data-lenis-prevent
      onScroll={() => {
        const scrollElement = scrollRef.current

        if (!scrollElement) {
          return
        }

        shouldStickToBottomRef.current = isNearBottom(scrollElement)
      }}
      className={cn(
        "chat-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:gap-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center sm:py-20">
            <p className="text-base font-medium tracking-tight">
              Start with your startup context
            </p>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
              Who is the customer, what problem are you solving, and what have
              you learned so far? Pins and your problem doc update as you talk.
            </p>
            {onOpenIngestion ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" onClick={onOpenIngestion}>
                  <FileUp className="size-4" aria-hidden="true" />
                  Import context
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenIngestion}
                >
                  <MessageSquarePlus className="size-4" aria-hidden="true" />
                  Paste notes or export
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble key={message.public_id} message={message} />
          ))
        )}

        {activityLabel ? (
          <div
            className="text-muted-foreground flex items-center gap-2 text-xs"
            aria-live="polite"
          >
            <span
              className="bg-brand size-1.5 animate-pulse rounded-full"
              aria-hidden="true"
            />
            {activityLabel}
          </div>
        ) : null}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden="true" />
      </div>
    </div>
  )
}
