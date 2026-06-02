"use client"

import { cn } from "@/lib/utils"
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
  onExploreSeparately?: () => void
  onOpenIngestion?: () => void
  onImportFiles?: (files: File[]) => void | Promise<void>
  className?: string
}

export function ChatPanel({
  messages,
  activityLabel,
  isStreaming,
  error,
  onSend,
  onExploreSeparately,
  onOpenIngestion,
  onImportFiles,
  className,
}: ChatPanelProps) {
  return (
    <section
      className={cn(
        "chat-panel-bg relative flex min-h-0 min-w-0 flex-col",
        className
      )}
    >
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
        {...(onOpenIngestion ? { onOpenIngestion } : {})}
      />
      <ChatComposer
        disabled={isStreaming}
        onSend={onSend}
        {...(onExploreSeparately ? { onExploreSeparately } : {})}
        {...(onOpenIngestion ? { onOpenIngestion } : {})}
        {...(onImportFiles ? { onImportFiles } : {})}
      />
    </section>
  )
}
