"use client"

import { GitBranch, Tag, Trash2 } from "lucide-react"
import type { ConversationRead } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { getConversationGitMetaFromHistory } from "@/features/idea-history/lib/conversation-meta"
import { useOptionalIdeaHistory } from "@/features/idea-history/components/idea-history-provider"
import {
  getConversationGitMeta,
  getConversationPreview,
  getConversationSubtitle,
  getConversationTitle,
} from "@/features/workspace/data/conversation-meta"
import { cn } from "@/lib/utils"

export type ConversationListItem = {
  conversation: ConversationRead
  preview?: string | null
}

type ConversationListProps = {
  activeConversationId: string
  items: ConversationListItem[]
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation?: (conversationId: string) => void | Promise<void>
  className?: string
}

export function ConversationList({
  activeConversationId,
  items,
  onSelectConversation,
  onDeleteConversation,
  className,
}: ConversationListProps) {
  const ideaHistory = useOptionalIdeaHistory()

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground px-3 py-4 text-xs leading-5">
        No conversations yet. Start a new chat to begin.
      </p>
    )
  }

  return (
    <ul className={cn("space-y-0.5 px-2 pb-2", className)}>
      {items.map(({ conversation, preview }, index) => {
        const isActive = conversation.public_id === activeConversationId
        const title = getConversationTitle(conversation, preview)
        const git = ideaHistory
          ? getConversationGitMetaFromHistory(
              ideaHistory.state,
              conversation.public_id
            )
          : getConversationGitMeta(conversation.public_id, index)
        const summary = getConversationPreview(conversation, preview)
        const subtitle = getConversationSubtitle(conversation)

        return (
          <li key={conversation.public_id} className="group relative">
            <button
              type="button"
              onClick={() => onSelectConversation(conversation.public_id)}
              className={cn(
                "w-full rounded-lg px-2.5 py-2 pr-9 text-left transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-current={isActive ? "true" : undefined}
            >
              <p className="truncate text-sm font-medium">{title}</p>
              {summary ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-4 opacity-80">
                  {summary}
                </p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                <span className="inline-flex items-center gap-1 font-mono opacity-70">
                  <GitBranch className="size-3" aria-hidden="true" />
                  {git.branch}
                </span>
                {git.tag ? (
                  <span className="inline-flex items-center gap-1 font-mono opacity-70">
                    <Tag className="size-3" aria-hidden="true" />
                    {git.tag}
                  </span>
                ) : null}
                <span className="opacity-50">{subtitle}</span>
              </div>
            </button>
            {onDeleteConversation ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive absolute top-1.5 right-1 size-7 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                aria-label="Delete conversation"
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeleteConversation(conversation.public_id)
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
