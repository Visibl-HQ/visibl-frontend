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
import { Building2, FileStack, Loader2, MessageSquare } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { sendChatMessage } from "@/lib/api/chat"
import {
  acceptCandidate,
  archiveCandidate,
  archivePin,
  clarifyCandidate,
  confirmPin,
  createConversation,
  deleteConversation,
  editAcceptCandidate,
  getCompanyMap,
  getProject,
  getWorkspace,
  listArtifacts,
  listConversations,
  listPins,
  promotePin,
  rejectCandidate,
  updatePin,
} from "@/lib/api/projects"
import type {
  ArtifactRead,
  CompanyMapCandidateRead,
  CompanyMapFieldRead,
  ConversationRead,
  MemoryPinRead,
  MessageRead,
  ProblemCustomerDocRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { ChatPanel } from "@/features/workspace/components/chat-panel"
import type { ChatMessage } from "@/features/workspace/components/chat-thread"
import { ArtifactHubPanel } from "@/features/workspace/components/artifact-hub-panel"
import { CompanyMapPanel } from "@/features/workspace/components/company-map-panel"
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

type WorkspaceMode = "company-map" | "artifact-hub" | "chat"

function toChatMessages(messages: MessageRead[]): ChatMessage[] {
  return messages.map((message) => ({ ...message }))
}

function truncatePreview(value: string, max = 96): string {
  return truncateConversationText(value, max)
}

function getFirstCompanyMapField(
  workspace: WorkspaceRead
): CompanyMapFieldRead | null {
  return workspace.company_map.groups[0]?.fields[0] ?? null
}

function findCompanyMapField(
  workspace: WorkspaceRead,
  fieldKey: string | null
): CompanyMapFieldRead | null {
  if (!fieldKey) {
    return getFirstCompanyMapField(workspace)
  }

  return (
    workspace.company_map.groups
      .flatMap((group) => group.fields)
      .find((field) => field.key === fieldKey) ??
    getFirstCompanyMapField(workspace)
  )
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
  const [mobileContextCollapsed, setMobileContextCollapsed] = useState(true)
  const [sidebarView, setSidebarView] = useState<SidebarView>("chats")
  const [pendingPinId, setPendingPinId] = useState<string | null>(null)
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(
    null
  )

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
          const [project, conversationPage, companyMap, artifactHub] =
            await Promise.all([
              getProject(projectId),
              listConversations(projectId, { limit: 20 }),
              getCompanyMap(projectId),
              listArtifacts(projectId),
            ])

          if (
            cancelled ||
            requestedConversationId !== activeConversationIdRef.current
          ) {
            return
          }

          const draftWorkspace = createDraftWorkspace(
            project,
            companyMap,
            artifactHub
          )

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
            setWorkspace((current) =>
              current
                ? {
                    ...current,
                    company_map: payload.company_map,
                    memory_pins: payload.memory_pins,
                    problem_customer_doc: payload.problem_customer_doc,
                  }
                : current
            )
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

  const refreshCaptureState = useCallback(async () => {
    const [nextPins, nextCompanyMap, nextArtifactHub] = await Promise.all([
      listPins(projectId),
      getCompanyMap(projectId),
      listArtifacts(projectId),
    ])
    setMemoryPins(nextPins)
    setWorkspace((current) =>
      current
        ? {
            ...current,
            memory_pins: nextPins,
            company_map: nextCompanyMap,
            artifact_hub: nextArtifactHub,
          }
        : current
    )
  }, [projectId])

  const handleConfirmPin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.id)
      setError(null)
      try {
        await confirmPin(projectId, pin.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not confirm pin."
        )
      } finally {
        setPendingPinId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleEditPin = useCallback(
    async (pin: MemoryPinRead, content: string) => {
      setPendingPinId(pin.id)
      setError(null)
      try {
        await updatePin(projectId, pin.id, {
          content,
          payload: { ...pin.payload, content },
        })
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not update pin."
        )
      } finally {
        setPendingPinId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleArchivePin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.id)
      setError(null)
      try {
        await archivePin(projectId, pin.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not archive pin."
        )
      } finally {
        setPendingPinId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handlePromotePin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.id)
      setError(null)
      try {
        await promotePin(projectId, pin.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Set a Company Map field before promoting this pin."
        )
      } finally {
        setPendingPinId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleAcceptCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.id)
      setError(null)
      try {
        await acceptCandidate(projectId, candidate.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not accept candidate."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleEditAcceptCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead, value: string) => {
      setPendingCandidateId(candidate.id)
      setError(null)
      try {
        await editAcceptCandidate(projectId, candidate.id, value)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not accept edited candidate."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleRejectCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.id)
      setError(null)
      try {
        await rejectCandidate(projectId, candidate.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not reject candidate."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleArchiveCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.id)
      setError(null)
      try {
        await archiveCandidate(projectId, candidate.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not archive candidate."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectId, refreshCaptureState]
  )

  const handleClarifyCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.id)
      setError(null)
      try {
        await clarifyCandidate(projectId, candidate.id)
        await refreshCaptureState()
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not create clarifying question."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectId, refreshCaptureState]
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
        pendingPinId={pendingPinId}
        pendingCandidateId={pendingCandidateId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSend={handleSend}
        onConfirmPin={handleConfirmPin}
        onEditPin={handleEditPin}
        onArchivePin={handleArchivePin}
        onPromotePin={handlePromotePin}
        onAcceptCandidate={handleAcceptCandidate}
        onEditAcceptCandidate={handleEditAcceptCandidate}
        onRejectCandidate={handleRejectCandidate}
        onArchiveCandidate={handleArchiveCandidate}
        onClarifyCandidate={handleClarifyCandidate}
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
  pendingPinId: string | null
  pendingCandidateId: string | null
  onNewConversation: () => void | Promise<void>
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void | Promise<void>
  onSend: (content: string) => Promise<void>
  onConfirmPin: (pin: MemoryPinRead) => void | Promise<void>
  onEditPin: (pin: MemoryPinRead, content: string) => void | Promise<void>
  onArchivePin: (pin: MemoryPinRead) => void | Promise<void>
  onPromotePin: (pin: MemoryPinRead) => void | Promise<void>
  onAcceptCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onEditAcceptCandidate: (
    candidate: CompanyMapCandidateRead,
    value: string
  ) => void | Promise<void>
  onRejectCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onArchiveCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
  onClarifyCandidate: (
    candidate: CompanyMapCandidateRead
  ) => void | Promise<void>
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
  pendingPinId,
  pendingCandidateId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onSend,
  onConfirmPin,
  onEditPin,
  onArchivePin,
  onPromotePin,
  onAcceptCandidate,
  onEditAcceptCandidate,
  onRejectCandidate,
  onArchiveCandidate,
  onClarifyCandidate,
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
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceMode>("company-map")
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(
    () => getFirstCompanyMapField(workspace)?.key ?? null
  )
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    () => workspace.artifact_hub.artifacts[0]?.id ?? null
  )
  const selectedField = useMemo(
    () => findCompanyMapField(workspace, selectedFieldKey),
    [workspace, selectedFieldKey]
  )
  const selectedArtifact = useMemo<ArtifactRead | null>(
    () =>
      workspace.artifact_hub.artifacts.find(
        (artifact) => artifact.id === selectedArtifactId
      ) ??
      workspace.artifact_hub.artifacts[0] ??
      null,
    [workspace, selectedArtifactId]
  )
  const companyMapFields = useMemo(
    () => workspace.company_map.groups.flatMap((group) => group.fields),
    [workspace.company_map.groups]
  )

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

  function handleInspectPinSource() {
    setWorkspaceMode("chat")
  }

  function handleInspectCandidateSource() {
    setWorkspaceMode("chat")
  }

  function handleSelectPinField(field: CompanyMapFieldRead) {
    setSelectedFieldKey(field.key)
    setWorkspaceMode("company-map")
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
            <WorkspaceModeBar
              mode={workspaceMode}
              onModeChange={setWorkspaceMode}
            />
            {workspaceMode === "company-map" ? (
              <CompanyMapPanel
                companyMap={workspace.company_map}
                selectedFieldKey={selectedField?.key ?? null}
                pendingCandidateId={pendingCandidateId}
                onSelectField={(field) => {
                  setSelectedFieldKey(field.key)
                  setWorkspaceMode("company-map")
                }}
                onAcceptCandidate={onAcceptCandidate}
                onEditAcceptCandidate={onEditAcceptCandidate}
                onRejectCandidate={onRejectCandidate}
                onArchiveCandidate={onArchiveCandidate}
                onClarifyCandidate={onClarifyCandidate}
                onInspectCandidateSource={handleInspectCandidateSource}
              />
            ) : null}
            {workspaceMode === "artifact-hub" ? (
              <ArtifactHubPanel
                artifactHub={workspace.artifact_hub}
                selectedArtifactId={selectedArtifact?.id ?? null}
                onSelectArtifact={(artifact) => {
                  setSelectedArtifactId(artifact.id)
                  setWorkspaceMode("artifact-hub")
                }}
              />
            ) : null}
            {workspaceMode === "chat" ? (
              <>
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
              </>
            ) : null}
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
                  fields={companyMapFields}
                  selectedField={selectedField}
                  selectedArtifact={selectedArtifact}
                  pendingPinId={pendingPinId}
                  onConfirmPin={onConfirmPin}
                  onEditPin={onEditPin}
                  onArchivePin={onArchivePin}
                  onPromotePin={onPromotePin}
                  onInspectPinSource={handleInspectPinSource}
                  onSelectPinField={handleSelectPinField}
                />
              )}
            </ContextSidebarShell>
          </CollapsibleSidebar>
        </div>

        <aside
          className={cn(
            "border-border/70 bg-surface shrink-0 border-t lg:hidden",
            mobileContextCollapsed ? "max-h-12" : "max-h-[38vh]"
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
              fields={companyMapFields}
              selectedField={selectedField}
              selectedArtifact={selectedArtifact}
              pendingPinId={pendingPinId}
              onConfirmPin={onConfirmPin}
              onEditPin={onEditPin}
              onArchivePin={onArchivePin}
              onPromotePin={onPromotePin}
              onInspectPinSource={handleInspectPinSource}
              onSelectPinField={handleSelectPinField}
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

function WorkspaceModeBar({
  mode,
  onModeChange,
}: {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}) {
  const items: {
    mode: WorkspaceMode
    label: string
    icon: LucideIcon
  }[] = [
    { mode: "company-map", label: "Company Map", icon: Building2 },
    { mode: "artifact-hub", label: "Artifact Hub", icon: FileStack },
    { mode: "chat", label: "Chat", icon: MessageSquare },
  ]

  return (
    <div className="border-border/70 bg-surface/70 shrink-0 border-b px-3 py-2">
      <div
        className="bg-muted/50 inline-flex max-w-full gap-1 rounded-lg p-1"
        role="tablist"
        aria-label="Workspace mode"
      >
        {items.map((item) => {
          const Icon = item.icon
          const selected = mode === item.mode
          return (
            <Button
              key={item.mode}
              type="button"
              variant={selected ? "secondary" : "ghost"}
              size="sm"
              role="tab"
              aria-selected={selected}
              className="min-w-0 gap-1.5"
              onClick={() => onModeChange(item.mode)}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
