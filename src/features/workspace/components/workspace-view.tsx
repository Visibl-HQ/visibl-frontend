"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserMenu } from "@/features/projects/components/user-menu"
import { sendChatMessage } from "@/lib/api/chat"
import {
  createConversation,
  getWorkspace,
  listConversations,
} from "@/lib/api/projects"
import type {
  ConversationRead,
  MemoryPinRead,
  MessageRead,
  ProblemCustomerDocRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { ChatPanel } from "@/features/workspace/components/chat-panel"
import type { ChatMessage } from "@/features/workspace/components/chat-thread"
import { GitGraphPlaceholder } from "@/features/workspace/components/git-graph-placeholder"
import { MemoryPinsPanel } from "@/features/workspace/components/memory-pins-panel"
import { ProblemCustomerDocCard } from "@/features/workspace/components/problem-customer-doc-card"

type WorkspaceViewProps = {
  projectId: string
  conversationId: string
}

function toChatMessages(messages: MessageRead[]): ChatMessage[] {
  return messages.map((message) => ({ ...message }))
}

export function WorkspaceView({
  projectId,
  conversationId,
}: WorkspaceViewProps) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceRead | null>(null)
  const [conversations, setConversations] = useState<ConversationRead[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [memoryPins, setMemoryPins] = useState<MemoryPinRead[]>([])
  const [problemCustomerDoc, setProblemCustomerDoc] =
    useState<ProblemCustomerDocRead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activityLabel, setActivityLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hydrateWorkspace = useCallback((nextWorkspace: WorkspaceRead) => {
    setWorkspace(nextWorkspace)
    setMessages(toChatMessages(nextWorkspace.messages))
    setMemoryPins(nextWorkspace.memory_pins)
    setProblemCustomerDoc(nextWorkspace.problem_customer_doc)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadWorkspace() {
      setIsLoading(true)
      setError(null)

      try {
        const [nextWorkspace, conversationPage] = await Promise.all([
          getWorkspace(projectId, conversationId),
          listConversations(projectId, { limit: 20 }),
        ])

        if (cancelled) {
          return
        }

        hydrateWorkspace(nextWorkspace)
        setConversations(conversationPage.items)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load workspace."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [projectId, conversationId, hydrateWorkspace])

  const handleNewConversation = useCallback(async () => {
    const conversation = await createConversation(projectId)
    router.push(`/projects/${projectId}/conversations/${conversation.id}`)
  }, [projectId, router])

  const handleSend = useCallback(
    async (content: string) => {
      const optimisticUserId = `temp-user-${Date.now()}`
      const optimisticAssistantId = `temp-assistant-${Date.now()}`

      setIsStreaming(true)
      setActivityLabel("Assistant is thinking…")
      setError(null)

      setMessages((current) => [
        ...current,
        {
          id: optimisticUserId,
          conversation_id: conversationId,
          role: "user",
          content,
          sequence: current.length + 1,
          created_at: new Date().toISOString(),
        },
        {
          id: optimisticAssistantId,
          conversation_id: conversationId,
          role: "assistant",
          content: "",
          sequence: current.length + 2,
          created_at: new Date().toISOString(),
          isStreaming: true,
        },
      ])

      await sendChatMessage(projectId, conversationId, content, {
        onTextDelta: (chunk) => {
          setActivityLabel(null)
          setMessages((current) =>
            current.map((message) =>
              message.id === optimisticAssistantId
                ? {
                    ...message,
                    content: message.content + chunk,
                    isStreaming: true,
                  }
                : message
            )
          )
        },
        onToolCall: (tool) => {
          if (tool === "update_problem_customer_section") {
            setActivityLabel("Updating problem & customer…")
          }

          if (tool === "create_memory_pin") {
            setActivityLabel("Pinned a note…")
          }
        },
        onDone: (payload) => {
          setMessages((current) =>
            current.map((message) => {
              if (message.id === optimisticUserId) {
                return { ...message, id: payload.user_message_id }
              }

              if (message.id === optimisticAssistantId) {
                return {
                  ...message,
                  id: payload.assistant_message_id,
                  isStreaming: false,
                }
              }

              return message
            })
          )
          setMemoryPins(payload.memory_pins)
          setProblemCustomerDoc(payload.problem_customer_doc)
          setActivityLabel(null)
          setIsStreaming(false)
        },
        onError: (streamError) => {
          setError(streamError.message)
          setActivityLabel(null)
          setIsStreaming(false)
          setMessages((current) =>
            current.filter((message) => message.id !== optimisticAssistantId)
          )
        },
      })
    },
    [conversationId, projectId]
  )

  const conversationOptions = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        label:
          conversation.title ?? `Conversation ${conversation.id.slice(0, 8)}`,
      })),
    [conversations]
  )

  if (isLoading) {
    return (
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
        <Skeleton className="hidden min-h-screen lg:block" />
        <Skeleton className="min-h-screen" />
        <Skeleton className="hidden min-h-screen lg:block" />
      </div>
    )
  }

  if (error && !workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        <Button asChild variant="outline">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    )
  }

  if (!workspace || !problemCustomerDoc) {
    return null
  }

  return (
    <AppShell fixedHeight>
      <AppHeader
        index="02"
        label="Workspace"
        title={workspace.project.name}
        backHref="/projects"
        backLabel="Projects"
        actions={
          <>
            {conversationOptions.length > 0 ? (
              <label className="hidden items-center gap-2 md:flex">
                <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                  Thread
                </span>
                <select
                  className="border-border/70 bg-background h-8 rounded-md border px-2 text-xs"
                  value={conversationId}
                  onChange={(event) => {
                    router.push(
                      `/projects/${projectId}/conversations/${event.target.value}`,
                    )
                  }}
                >
                  {conversationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void handleNewConversation()}>
              <Plus className="size-4" aria-hidden="true" />
              New
            </Button>
            <UserMenu />
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_22rem]">
        <div className="hidden min-h-0 lg:block">
          <GitGraphPlaceholder
            projectName={workspace.project.name}
            userDisplayName={workspace.user_display_name}
          />
        </div>

        <ChatPanel
          messages={messages}
          activityLabel={activityLabel}
          isStreaming={isStreaming}
          error={error}
          onSend={handleSend}
          className="min-h-0 flex-1 lg:flex-none"
        />

        <aside
          data-lenis-prevent
          className="border-border/70 bg-surface max-h-[38vh] min-h-0 shrink-0 space-y-4 overflow-y-auto overscroll-contain border-t p-4 lg:max-h-full lg:border-t-0"
        >
          <MemoryPinsPanel pins={memoryPins} />
          <ProblemCustomerDocCard doc={problemCustomerDoc} />
        </aside>
      </div>

      {isStreaming ? (
        <div className="sr-only" aria-live="polite">
          Assistant is responding
        </div>
      ) : null}
    </AppShell>
  )
}
