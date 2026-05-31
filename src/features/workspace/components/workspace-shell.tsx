"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { sendChatMessage } from "@/lib/api/chat"
import {
  createConversation,
  deleteConversation,
  getProject,
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
import { CheckpointToolbar } from "@/features/idea-history/components/checkpoint-toolbar"
import {
  IdeaHistoryProvider,
  useIdeaHistory,
} from "@/features/idea-history/components/idea-history-provider"
import { OneOffExplorationPanel } from "@/features/idea-history/components/one-off-exploration-panel"
import { slugifyBranchName } from "@/features/idea-history/lib/history-state"
import { getGraphNodeInsight } from "@/features/idea-history/lib/checkpoint-graph-meta"
import type { GraphNodeInsight } from "@/features/idea-history/lib/checkpoint-graph-meta"
import type { Checkpoint } from "@/features/idea-history/types"
import type { GitGraphNode } from "@/features/workspace/data/demo-git-graph"
import {
  ContextSidebarShell,
  WorkspaceContextSidebar,
  WorkspaceContextSidebarCollapsed,
  WorkspaceContextSidebarContent,
} from "@/features/workspace/components/workspace-context-sidebar"
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header"
import {
  WorkspaceSidebar,
  type SidebarView,
} from "@/features/workspace/components/workspace-sidebar"
import type { ConversationListItem } from "@/features/workspace/components/conversation-list"
import {
  sortConversationsByRecent,
  truncateConversationText,
} from "@/features/workspace/data/conversation-meta"
import {
  conversationPath,
  draftConversationPath,
  isDraftConversationId,
} from "@/features/workspace/lib/conversation-routing"
import { createDraftWorkspace } from "@/features/workspace/lib/empty-workspace"
import {
  extractConversationPreview,
  hydrateMissingConversationPreviews,
  loadStoredConversationPreviews,
  persistConversationPreviews,
} from "@/features/workspace/lib/conversation-previews"
import { cn } from "@/lib/utils"

const LEFT_EXPANDED = 260
const LEFT_COLLAPSED = 48
const RIGHT_EXPANDED = 280
const RIGHT_COLLAPSED = 48

type WorkspaceShellProps = {
  projectId: string
}

function toChatMessages(messages: MessageRead[]): ChatMessage[] {
  return messages.map((message) => ({ ...message }))
}

function truncatePreview(value: string, max = 96): string {
  return truncateConversationText(value, max)
}

export function WorkspaceShell({ projectId }: WorkspaceShellProps) {
  const router = useRouter()
  const params = useParams<{ conversationId?: string }>()
  const conversationId = params.conversationId ?? ""
  const hasBootstrappedRef = useRef(false)
  const activeConversationIdRef = useRef(conversationId)
  const skipConversationLoadRef = useRef<string | null>(null)
  const chatAbortRef = useRef<AbortController | null>(null)
  const previewHydrationAbortRef = useRef<AbortController | null>(null)
  const conversationPreviewsRef = useRef<Record<string, string>>({})
  const assistantStreamRef = useRef("")
  const [, startTransition] = useTransition()

  const [workspace, setWorkspace] = useState<WorkspaceRead | null>(null)
  const [conversations, setConversations] = useState<ConversationRead[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationPreviews, setConversationPreviews] = useState<
    Record<string, string>
  >(() => loadStoredConversationPreviews(projectId))
  const [memoryPins, setMemoryPins] = useState<MemoryPinRead[]>([])
  const [problemCustomerDoc, setProblemCustomerDoc] =
    useState<ProblemCustomerDocRead | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activityLabel, setActivityLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [mobileContextCollapsed, setMobileContextCollapsed] = useState(false)
  const [sidebarView, setSidebarView] = useState<SidebarView>("chats")

  useEffect(() => {
    conversationPreviewsRef.current = conversationPreviews
  }, [conversationPreviews])

  const rememberConversationPreview = useCallback(
    (targetConversationId: string, preview: string) => {
      setConversationPreviews((current) => {
        if (current[targetConversationId] === preview) {
          return current
        }

        const next = { ...current, [targetConversationId]: preview }
        conversationPreviewsRef.current = next
        persistConversationPreviews(projectId, next)
        return next
      })
    },
    [projectId]
  )

  const queueConversationPreviewHydration = useCallback(
    (items: ConversationRead[], activeConversationId: string) => {
      previewHydrationAbortRef.current?.abort()
      const controller = new AbortController()
      previewHydrationAbortRef.current = controller

      void hydrateMissingConversationPreviews({
        projectId,
        conversations: items,
        activeConversationId,
        knownPreviews: conversationPreviewsRef.current,
        onPreview: rememberConversationPreview,
        signal: controller.signal,
      })
    },
    [projectId, rememberConversationPreview]
  )

  useEffect(() => {
    activeConversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    chatAbortRef.current?.abort()
    chatAbortRef.current = new AbortController()

    return () => {
      chatAbortRef.current?.abort()
      previewHydrationAbortRef.current?.abort()
    }
  }, [conversationId])

  const hydrateWorkspace = useCallback(
    (nextWorkspace: WorkspaceRead) => {
      const workspaceConversationId = nextWorkspace.conversation.id

      if (workspaceConversationId !== activeConversationIdRef.current) {
        return
      }

      setWorkspace(nextWorkspace)
      setMessages(toChatMessages(nextWorkspace.messages))
      setMemoryPins(nextWorkspace.memory_pins)
      setProblemCustomerDoc(nextWorkspace.problem_customer_doc)

      const preview = extractConversationPreview(nextWorkspace)

      if (preview) {
        rememberConversationPreview(workspaceConversationId, preview)
      }
    },
    [rememberConversationPreview]
  )

  useEffect(() => {
    if (!conversationId) {
      return
    }

    let cancelled = false
    const requestedConversationId = conversationId
    const isDraft = isDraftConversationId(requestedConversationId)
    const isFirstLoad = !hasBootstrappedRef.current

    async function loadWorkspace() {
      if (isFirstLoad) {
        setIsBootstrapping(true)
      } else if (!isDraft) {
        setIsConversationLoading(true)
      }

      if (
        skipConversationLoadRef.current === requestedConversationId &&
        !isDraft
      ) {
        skipConversationLoadRef.current = null

        try {
          const conversationPage = await listConversations(projectId, {
            limit: 20,
          })

          if (
            !cancelled &&
            requestedConversationId === activeConversationIdRef.current
          ) {
            const sorted = sortConversationsByRecent(conversationPage.items)
            setConversations(sorted)
            queueConversationPreviewHydration(sorted, requestedConversationId)
            hasBootstrappedRef.current = true
          }
        } catch (loadError) {
          if (
            !cancelled &&
            requestedConversationId === activeConversationIdRef.current
          ) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Could not load conversations."
            )
          }
        } finally {
          if (
            !cancelled &&
            requestedConversationId === activeConversationIdRef.current
          ) {
            setIsBootstrapping(false)
            setIsConversationLoading(false)
          }
        }

        return
      }

      if (
        !cancelled &&
        requestedConversationId === activeConversationIdRef.current &&
        !skipConversationLoadRef.current
      ) {
        setMessages([])
        setIsStreaming(false)
        setActivityLabel(null)
        setError(null)
      }

      try {
        if (isDraft) {
          const [project, conversationPage] = await Promise.all([
            getProject(projectId),
            listConversations(projectId, { limit: 20 }),
          ])

          if (
            cancelled ||
            requestedConversationId !== activeConversationIdRef.current
          ) {
            return
          }

          const draftWorkspace = createDraftWorkspace(project)

          setWorkspace(draftWorkspace)
          setMessages([])
          setMemoryPins([])
          setProblemCustomerDoc(draftWorkspace.problem_customer_doc)
          const sorted = sortConversationsByRecent(conversationPage.items)
          setConversations(sorted)
          queueConversationPreviewHydration(sorted, requestedConversationId)
          hasBootstrappedRef.current = true
          return
        }

        const [nextWorkspace, conversationPage] = await Promise.all([
          getWorkspace(projectId, requestedConversationId),
          listConversations(projectId, { limit: 20 }),
        ])

        if (
          cancelled ||
          requestedConversationId !== activeConversationIdRef.current
        ) {
          return
        }

        hydrateWorkspace(nextWorkspace)
        const sorted = sortConversationsByRecent(conversationPage.items)
        setConversations(sorted)
        queueConversationPreviewHydration(sorted, requestedConversationId)
        hasBootstrappedRef.current = true
      } catch (loadError) {
        if (
          !cancelled &&
          requestedConversationId === activeConversationIdRef.current
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load workspace."
          )
        }
      } finally {
        if (
          !cancelled &&
          requestedConversationId === activeConversationIdRef.current
        ) {
          setIsBootstrapping(false)
          setIsConversationLoading(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [
    projectId,
    conversationId,
    hydrateWorkspace,
    queueConversationPreviewHydration,
  ])

  const handleSelectConversation = useCallback(
    (nextConversationId: string) => {
      if (nextConversationId === conversationId) {
        return
      }

      startTransition(() => {
        router.replace(
          `/projects/${projectId}/conversations/${nextConversationId}`,
          { scroll: false }
        )
      })
    },
    [conversationId, projectId, router]
  )

  const handleNewConversation = useCallback(() => {
    if (isDraftConversationId(conversationId)) {
      setMessages([])
      setError(null)
      setIsStreaming(false)
      setActivityLabel(null)
      return
    }

    router.replace(draftConversationPath(projectId), { scroll: false })
  }, [conversationId, projectId, router])

  const handleDeleteConversation = useCallback(
    async (targetConversationId: string) => {
      setError(null)

      try {
        await deleteConversation(projectId, targetConversationId)

        setConversationPreviews((current) => {
          const next = { ...current }
          delete next[targetConversationId]
          conversationPreviewsRef.current = next
          persistConversationPreviews(projectId, next)
          return next
        })

        setConversations((current) => {
          const remaining = current.filter(
            (item) => item.id !== targetConversationId
          )

          if (targetConversationId === activeConversationIdRef.current) {
            const next = sortConversationsByRecent(remaining)[0]

            startTransition(() => {
              router.replace(
                next
                  ? conversationPath(projectId, next.id)
                  : draftConversationPath(projectId),
                { scroll: false }
              )
            })
          }

          return remaining
        })
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete conversation."
        )
      }
    },
    [projectId, router]
  )

  const handleSend = useCallback(
    async (content: string) => {
      let sendConversationId = conversationId

      if (isDraftConversationId(conversationId)) {
        setError(null)

        try {
          const conversation = await createConversation(projectId)
          sendConversationId = conversation.id
          skipConversationLoadRef.current = sendConversationId
          activeConversationIdRef.current = sendConversationId

          setConversations((current) =>
            sortConversationsByRecent([
              conversation,
              ...current.filter((item) => item.id !== conversation.id),
            ])
          )

          setWorkspace((current) =>
            current
              ? {
                  ...current,
                  conversation,
                  problem_customer_doc: {
                    ...current.problem_customer_doc,
                    conversation_id: conversation.id,
                  },
                }
              : current
          )

          setProblemCustomerDoc((current) =>
            current
              ? {
                  ...current,
                  conversation_id: conversation.id,
                }
              : current
          )

          router.replace(conversationPath(projectId, sendConversationId), {
            scroll: false,
          })
        } catch (createError) {
          setError(
            createError instanceof Error
              ? createError.message
              : "Could not start conversation."
          )
          return
        }
      }

      const optimisticUserId = `temp-user-${Date.now()}`
      const optimisticAssistantId = `temp-assistant-${Date.now()}`

      setIsStreaming(true)
      setActivityLabel("Assistant is thinking…")
      setError(null)
      assistantStreamRef.current = ""

      flushSync(() => {
        setMessages((current) => [
          ...current,
          {
            id: optimisticUserId,
            conversation_id: sendConversationId,
            role: "user",
            content,
            sequence: current.length + 1,
            created_at: new Date().toISOString(),
          },
          {
            id: optimisticAssistantId,
            conversation_id: sendConversationId,
            role: "assistant",
            content: "",
            sequence: current.length + 2,
            created_at: new Date().toISOString(),
            isStreaming: true,
          },
        ])
      })

      await sendChatMessage(
        projectId,
        sendConversationId,
        content,
        {
          onTextDelta: (chunk) => {
            if (sendConversationId !== activeConversationIdRef.current) {
              return
            }

            assistantStreamRef.current += chunk
            const streamedContent = assistantStreamRef.current

            setActivityLabel(null)
            setMessages((current) =>
              current.map((message) =>
                message.id === optimisticAssistantId
                  ? {
                      ...message,
                      content: streamedContent,
                      isStreaming: true,
                    }
                  : message
              )
            )
          },
          onToolCall: (tool) => {
            if (sendConversationId !== activeConversationIdRef.current) {
              return
            }

            if (tool === "update_problem_customer_section") {
              setActivityLabel("Updating problem & customer…")
            }

            if (tool === "create_memory_pin") {
              setActivityLabel("Pinned a note…")
            }
          },
          onDone: (payload) => {
            if (sendConversationId !== activeConversationIdRef.current) {
              return
            }

            const streamedContent = assistantStreamRef.current

            setMessages((current) =>
              current.map((message) => {
                if (message.id === optimisticUserId) {
                  return { ...message, id: payload.user_message_id }
                }

                if (message.id === optimisticAssistantId) {
                  return {
                    ...message,
                    id: payload.assistant_message_id,
                    content: streamedContent || message.content,
                    isStreaming: false,
                  }
                }

                return message
              })
            )
            assistantStreamRef.current = ""
            setMemoryPins(payload.memory_pins)
            setProblemCustomerDoc(payload.problem_customer_doc)
            setActivityLabel(null)
            setIsStreaming(false)

            rememberConversationPreview(
              sendConversationId,
              truncatePreview(content)
            )

            void listConversations(projectId, { limit: 20 })
              .then((page) => {
                const sorted = sortConversationsByRecent(page.items)
                setConversations(sorted)
                queueConversationPreviewHydration(sorted, sendConversationId)
              })
              .catch(() => {
                // Sidebar order can stay stale if list refresh fails.
              })

            void getWorkspace(projectId, sendConversationId)
              .then((nextWorkspace) => {
                hydrateWorkspace(nextWorkspace)
              })
              .catch(() => {
                // Keep streamed content if workspace refresh fails.
              })
          },
          onError: (streamError) => {
            if (sendConversationId !== activeConversationIdRef.current) {
              return
            }

            assistantStreamRef.current = ""
            setError(streamError.message)
            setActivityLabel(null)
            setIsStreaming(false)
            setMessages((current) =>
              current.filter((message) => message.id !== optimisticAssistantId)
            )
          },
        },
        chatAbortRef.current?.signal
      )
    },
    [
      conversationId,
      projectId,
      hydrateWorkspace,
      queueConversationPreviewHydration,
      rememberConversationPreview,
      router,
    ]
  )

  const conversationItems = useMemo(() => {
    return conversations.map((conversation) => {
      const isActive = conversation.id === conversationId
      const activeFirstUser = isActive
        ? messages.find((message) => message.role === "user")
        : undefined
      const preview =
        activeFirstUser !== undefined
          ? truncatePreview(activeFirstUser.content)
          : (conversationPreviews[conversation.id] ?? null)

      return { conversation, preview }
    })
  }, [conversations, conversationId, conversationPreviews, messages])

  const gridTemplateColumns = useMemo(() => {
    const left = leftCollapsed ? LEFT_COLLAPSED : LEFT_EXPANDED
    const right = rightCollapsed ? RIGHT_COLLAPSED : RIGHT_EXPANDED
    return `${left}px minmax(0, 1fr) ${right}px`
  }, [leftCollapsed, rightCollapsed])

  const handleApplyCheckpointSnapshot = useCallback(
    (checkpoint: Checkpoint) => {
      setMemoryPins(checkpoint.pinsSnapshot.map((pin) => ({ ...pin })))
      setProblemCustomerDoc({
        ...checkpoint.docSnapshot,
        checklist: { ...checkpoint.docSnapshot.checklist },
      })
    },
    []
  )

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
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
    <IdeaHistoryProvider
      projectId={projectId}
      conversationId={conversationId}
      pins={memoryPins}
      doc={problemCustomerDoc}
      messageCount={messages.length}
      onApplyCheckpointSnapshot={handleApplyCheckpointSnapshot}
      onNavigateConversation={handleSelectConversation}
    >
      <WorkspaceShellLayout
        workspace={workspace}
        conversationId={conversationId}
        conversationItems={conversationItems}
        messages={messages}
        memoryPins={memoryPins}
        problemCustomerDoc={problemCustomerDoc}
        isConversationLoading={isConversationLoading}
        isStreaming={isStreaming}
        activityLabel={activityLabel}
        error={error}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        mobileContextCollapsed={mobileContextCollapsed}
        sidebarView={sidebarView}
        gridTemplateColumns={gridTemplateColumns}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSend={handleSend}
        onToggleLeftCollapse={() => setLeftCollapsed((current) => !current)}
        onToggleRightCollapse={() => setRightCollapsed((current) => !current)}
        onExpandRightSidebar={() => setRightCollapsed(false)}
        onToggleMobileContext={() =>
          setMobileContextCollapsed((current) => !current)
        }
        onExpandMobileContext={() => setMobileContextCollapsed(false)}
        onSidebarViewChange={setSidebarView}
      />
    </IdeaHistoryProvider>
  )
}

type WorkspaceShellLayoutProps = {
  workspace: WorkspaceRead
  conversationId: string
  conversationItems: ConversationListItem[]
  messages: ChatMessage[]
  memoryPins: MemoryPinRead[]
  problemCustomerDoc: ProblemCustomerDocRead
  isConversationLoading: boolean
  isStreaming: boolean
  activityLabel: string | null
  error: string | null
  leftCollapsed: boolean
  rightCollapsed: boolean
  mobileContextCollapsed: boolean
  sidebarView: SidebarView
  gridTemplateColumns: string
  onNewConversation: () => void | Promise<void>
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void | Promise<void>
  onSend: (content: string) => Promise<void>
  onToggleLeftCollapse: () => void
  onToggleRightCollapse: () => void
  onExpandRightSidebar: () => void
  onToggleMobileContext: () => void
  onExpandMobileContext: () => void
  onSidebarViewChange: (view: SidebarView) => void
}

function WorkspaceShellLayout({
  workspace,
  conversationId,
  conversationItems,
  messages,
  memoryPins,
  problemCustomerDoc,
  isConversationLoading,
  isStreaming,
  activityLabel,
  error,
  leftCollapsed,
  rightCollapsed,
  mobileContextCollapsed,
  sidebarView,
  gridTemplateColumns,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onSend,
  onToggleLeftCollapse,
  onToggleRightCollapse,
  onExpandRightSidebar,
  onToggleMobileContext,
  onExpandMobileContext,
  onSidebarViewChange,
}: WorkspaceShellLayoutProps) {
  const isDraftConversation = isDraftConversationId(conversationId)
  const {
    graphNodes,
    graphConnections,
    graphLaneCount,
    oneOffOpen,
    oneOffSession,
    activeBinding,
    actionError,
    isActionPending,
    openOneOff,
    closeOneOff,
    sendOneOffQuestion,
    openBranchDialog,
    selectGraphNode,
    state,
  } = useIdeaHistory()

  const getNodeInsight = useCallback(
    (node: GitGraphNode): GraphNodeInsight | null => {
      if (node.checkpointId) {
        return getGraphNodeInsight(state, node)
      }

      if (node.branchId) {
        const branch = state.branches.find((item) => item.id === node.branchId)

        if (branch?.forkedFromCheckpointId) {
          return getGraphNodeInsight(state, {
            ...node,
            checkpointId: branch.forkedFromCheckpointId,
            kind: "commit",
          } as GitGraphNode)
        }
      }

      return null
    },
    [state]
  )

  function handlePursueAsBranch() {
    const suggested = oneOffSession?.question
      ? `explore/${slugifyBranchName(oneOffSession.question.slice(0, 48))}`
      : "explore"

    closeOneOff()
    openBranchDialog(suggested)
  }

  return (
    <AppShell fixedHeight>
      <WorkspaceHeader
        projectName={workspace.project.name}
        onNewConversation={onNewConversation}
      />

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:[grid-template-columns:var(--workspace-cols)]"
        style={
          {
            "--workspace-cols": gridTemplateColumns,
          } as React.CSSProperties
        }
      >
        <div className="hidden min-h-0 lg:block">
          <CollapsibleSidebar side="left" collapsed={leftCollapsed}>
            <WorkspaceSidebar
              projectName={workspace.project.name}
              activeConversationId={conversationId}
              conversationItems={conversationItems}
              view={sidebarView}
              onViewChange={onSidebarViewChange}
              onNewConversation={onNewConversation}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={onDeleteConversation}
              graphNodes={graphNodes}
              graphConnections={graphConnections}
              graphLaneCount={graphLaneCount}
              activeCheckpointId={activeBinding?.lastCheckpointId ?? null}
              onSelectGraphNode={selectGraphNode}
              getGraphNodeInsight={getNodeInsight}
              collapsed={leftCollapsed}
              onToggleCollapse={onToggleLeftCollapse}
            />
          </CollapsibleSidebar>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {isConversationLoading ? (
            <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader2
                className="text-muted-foreground size-5 animate-spin"
                aria-hidden="true"
              />
              <span className="sr-only">Loading conversation</span>
            </div>
          ) : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!isDraftConversation ? <CheckpointToolbar /> : null}
            <ChatPanel
              messages={messages}
              activityLabel={activityLabel}
              isStreaming={isStreaming}
              error={error}
              onSend={onSend}
              {...(!isDraftConversation
                ? { onExploreSeparately: openOneOff }
                : {})}
              className="min-h-0 flex-1"
            />
          </div>
          {oneOffOpen ? (
            <OneOffExplorationPanel
              open={oneOffOpen}
              session={oneOffSession}
              isPending={isActionPending}
              actionError={actionError}
              onClose={closeOneOff}
              onAsk={sendOneOffQuestion}
              onDismiss={() => {
                closeOneOff()
              }}
              onPursueAsBranch={handlePursueAsBranch}
            />
          ) : null}
        </div>

        <div className="hidden min-h-0 lg:block">
          <CollapsibleSidebar
            side="right"
            collapsed={rightCollapsed}
            className="bg-surface"
          >
            <ContextSidebarShell
              collapsed={rightCollapsed}
              onToggleCollapse={onToggleRightCollapse}
            >
              {rightCollapsed ? (
                <WorkspaceContextSidebarCollapsed
                  pinCount={memoryPins.length}
                  docCompletion={Math.round(
                    problemCustomerDoc.completion_percentage
                  )}
                  onExpand={onExpandRightSidebar}
                />
              ) : (
                <WorkspaceContextSidebarContent
                  pins={memoryPins}
                  doc={problemCustomerDoc}
                />
              )}
            </ContextSidebarShell>
          </CollapsibleSidebar>
        </div>

        <aside
          className={cn(
            "border-border/70 bg-surface shrink-0 border-t lg:hidden",
            mobileContextCollapsed ? "max-h-12" : "max-h-[34vh]"
          )}
        >
          <div className="flex items-center justify-end px-2 py-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={onToggleMobileContext}
            >
              {mobileContextCollapsed ? "Show context" : "Hide context"}
            </Button>
          </div>
          {!mobileContextCollapsed ? (
            <WorkspaceContextSidebar
              pins={memoryPins}
              doc={problemCustomerDoc}
              collapsed={false}
              onExpand={onExpandMobileContext}
            />
          ) : null}
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
