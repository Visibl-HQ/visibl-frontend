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
import { useParams, usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { sendChatMessage } from "@/lib/api/chat"
import { ApiError } from "@/lib/api/client"
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
  getWorkspace,
  listArtifacts,
  listConversations,
  listPins,
  promotePin,
  rejectCandidate,
  updatePin,
} from "@/lib/api/projects"
import type {
  ApplyIngestionResponse,
  ArtifactRead,
  CompanyMapCandidateRead,
  CompanyMapFieldRead,
  ConversationRead,
  MemoryPinRead,
  MessageRead,
  ProblemCustomerDocRead,
  WorkspaceRead,
} from "@/lib/api/types"
import { normalizeMemoryPins } from "@/lib/api/normalize-memory-pin"
import { ChatPanel } from "@/features/workspace/components/chat-panel"
import type { ChatMessage } from "@/features/workspace/components/chat-thread"
import { IngestionDialog } from "@/features/ingestion/components/ingestion-dialog"
import { IngestionPreviewDialog } from "@/features/ingestion/components/ingestion-preview-dialog"
import { useIngestionFlow } from "@/features/ingestion/hooks/use-ingestion-flow"
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
import { ProjectWorkspaceNav } from "@/features/workspace/components/project-workspace-nav"
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
import {
  extractConversationPreview,
  loadStoredConversationPreviews,
  persistConversationPreviews,
} from "@/features/workspace/lib/conversation-previews"
import {
  buildDraftWorkspaceFromGlobals,
  mergeConversationWithGlobals,
} from "@/features/workspace/lib/workspace-loader"
import {
  companyMapPath,
  resolveProjectWorkspaceSection,
} from "@/features/workspace/lib/workspace-routing"
import {
  useConversationPreviewHydration,
  useProjectGlobals,
} from "@/features/workspace/components/workspace-data-provider"
import { WorkspaceLayoutSkeleton } from "@/features/workspace/components/workspace-skeletons"
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header"
import { cn } from "@/lib/utils"

const LEFT_EXPANDED = 260
const LEFT_COLLAPSED = 48
const RIGHT_EXPANDED = 280
const RIGHT_COLLAPSED = 48

type ConversationCacheEntry = {
  workspace: WorkspaceRead
  messages: ChatMessage[]
  memoryPins: MemoryPinRead[]
  problemCustomerDoc: ProblemCustomerDocRead
}

type WorkspaceShellProps = {
  projectPublicId: string
  username: string
  projectSlug: string
}

function normalizeWorkspacePins(workspace: WorkspaceRead): WorkspaceRead {
  return {
    ...workspace,
    memory_pins: normalizeMemoryPins(workspace.memory_pins),
  }
}

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

function sliceMessagesForBranchView(
  messages: ChatMessage[],
  messageCount: number | null
): ChatMessage[] {
  if (messageCount === null) {
    return messages
  }

  return messages.slice(0, messageCount)
}

export function WorkspaceShell({
  projectPublicId,
  username,
  projectSlug,
}: WorkspaceShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ conversationId?: string }>()
  const workspaceSection = resolveProjectWorkspaceSection(
    pathname,
    username,
    projectSlug
  )
  const conversationId = params.conversationId ?? ""
  const hasBootstrappedRef = useRef(false)
  const conversationsLoadedRef = useRef(false)
  const activeConversationIdRef = useRef(conversationId)
  const conversationCacheRef = useRef<Map<string, ConversationCacheEntry>>(
    new Map()
  )
  const skipConversationLoadRef = useRef<string | null>(null)
  const chatAbortRef = useRef<AbortController | null>(null)
  const conversationPreviewsRef = useRef<Record<string, string>>({})
  const assistantStreamRef = useRef("")
  const allMessagesRef = useRef<ChatMessage[]>([])
  const branchViewCountRef = useRef<number | null>(null)
  const pendingCheckpointRestoreRef = useRef<Checkpoint | null>(null)
  const [, startTransition] = useTransition()

  const [workspace, setWorkspace] = useState<WorkspaceRead | null>(null)
  const [conversations, setConversations] = useState<ConversationRead[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationPreviews, setConversationPreviews] = useState<
    Record<string, string>
  >(() => loadStoredConversationPreviews(projectPublicId))
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
  const [staleCandidateId, setStaleCandidateId] = useState<string | null>(null)
  const [ingestionDialogOpen, setIngestionDialogOpen] = useState(false)

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
        persistConversationPreviews(projectPublicId, next)
        return next
      })
    },
    [projectPublicId]
  )

  const getKnownConversationPreviews = useCallback(
    () => conversationPreviewsRef.current,
    []
  )
  const { ensureProjectGlobals } = useProjectGlobals(projectPublicId)
  const { queueConversationPreviewHydration, abortPreviewHydration } =
    useConversationPreviewHydration({
      projectPublicId,
      rememberConversationPreview,
      getKnownPreviews: getKnownConversationPreviews,
    })

  useEffect(() => {
    activeConversationIdRef.current = conversationId
    branchViewCountRef.current = null
    allMessagesRef.current = []
  }, [conversationId])

  useEffect(() => {
    chatAbortRef.current?.abort()
    chatAbortRef.current = new AbortController()

    return () => {
      chatAbortRef.current?.abort()
      abortPreviewHydration()
    }
  }, [abortPreviewHydration, conversationId])

  const hydrateWorkspace = useCallback(
    (nextWorkspaceInput: WorkspaceRead) => {
      const nextWorkspace = normalizeWorkspacePins(nextWorkspaceInput)
      const workspaceConversationId = nextWorkspace.conversation.public_id

      if (workspaceConversationId !== activeConversationIdRef.current) {
        return
      }

      const fullMessages = toChatMessages(nextWorkspace.messages)
      allMessagesRef.current = fullMessages

      setWorkspace(nextWorkspace)
      setMessages((current) => {
        const limit = branchViewCountRef.current

        if (limit === null) {
          return fullMessages
        }

        const targetLength = Math.max(limit, current.length)
        return fullMessages.slice(
          0,
          Math.min(targetLength, fullMessages.length)
        )
      })
      setMemoryPins(nextWorkspace.memory_pins)
      setProblemCustomerDoc(nextWorkspace.problem_customer_doc)

      conversationCacheRef.current.set(workspaceConversationId, {
        workspace: nextWorkspace,
        messages: fullMessages,
        memoryPins: nextWorkspace.memory_pins,
        problemCustomerDoc: nextWorkspace.problem_customer_doc,
      })

      const pendingRestore = pendingCheckpointRestoreRef.current

      if (
        pendingRestore &&
        pendingRestore.conversationId === workspaceConversationId
      ) {
        pendingCheckpointRestoreRef.current = null
        branchViewCountRef.current = pendingRestore.messageCount
        const restoredMessages = sliceMessagesForBranchView(
          fullMessages,
          pendingRestore.messageCount
        )
        setMessages(restoredMessages)
        setMemoryPins(pendingRestore.pinsSnapshot.map((pin) => ({ ...pin })))
        setProblemCustomerDoc({
          ...pendingRestore.docSnapshot,
          checklist: { ...pendingRestore.docSnapshot.checklist },
        })
        conversationCacheRef.current.set(workspaceConversationId, {
          workspace: nextWorkspace,
          messages: restoredMessages,
          memoryPins: pendingRestore.pinsSnapshot.map((pin) => ({ ...pin })),
          problemCustomerDoc: {
            ...pendingRestore.docSnapshot,
            checklist: { ...pendingRestore.docSnapshot.checklist },
          },
        })
      }

      const preview = extractConversationPreview(nextWorkspace)

      if (preview) {
        rememberConversationPreview(workspaceConversationId, preview)
      }
    },
    [rememberConversationPreview]
  )

  useEffect(() => {
    if (workspaceSection !== "chat" || !conversationId) {
      return
    }

    let cancelled = false
    const requestedConversationId = conversationId
    const isDraft = isDraftConversationId(requestedConversationId)
    const isFirstLoad = !hasBootstrappedRef.current
    const cached = conversationCacheRef.current.get(requestedConversationId)

    async function refreshConversationList() {
      if (conversationsLoadedRef.current) {
        return
      }

      const globals = await ensureProjectGlobals()

      if (
        cancelled ||
        requestedConversationId !== activeConversationIdRef.current
      ) {
        return
      }

      setConversations(globals.conversations)
      conversationsLoadedRef.current = true
      queueConversationPreviewHydration(
        globals.conversations,
        requestedConversationId
      )
    }

    async function loadWorkspace() {
      if (isFirstLoad) {
        setIsBootstrapping(true)
      } else if (!isDraft && !cached) {
        setIsConversationLoading(true)
      }

      if (
        skipConversationLoadRef.current === requestedConversationId &&
        !isDraft
      ) {
        skipConversationLoadRef.current = null

        try {
          await refreshConversationList()
          hasBootstrappedRef.current = true
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

      if (cached && !isDraft) {
        setWorkspace(cached.workspace)
        setMessages(cached.messages)
        setMemoryPins(cached.memoryPins)
        setProblemCustomerDoc(cached.problemCustomerDoc)
        allMessagesRef.current = cached.messages
        setIsStreaming(false)
        setActivityLabel(null)
        setError(null)
        hasBootstrappedRef.current = true
        setIsBootstrapping(false)
        setIsConversationLoading(false)

        void ensureProjectGlobals()
          .then((globals) =>
            getWorkspace(projectPublicId, requestedConversationId).then(
              (bundle) => mergeConversationWithGlobals(bundle, globals)
            )
          )
          .then((nextWorkspace) => {
            if (
              !cancelled &&
              requestedConversationId === activeConversationIdRef.current
            ) {
              hydrateWorkspace(nextWorkspace)
            }
          })
          .catch(() => {
            // Keep cached conversation if refresh fails.
          })

        return
      }

      if (
        !cancelled &&
        requestedConversationId === activeConversationIdRef.current &&
        !skipConversationLoadRef.current
      ) {
        setIsStreaming(false)
        setActivityLabel(null)
        setError(null)
      }

      try {
        const globals = await ensureProjectGlobals()

        if (
          cancelled ||
          requestedConversationId !== activeConversationIdRef.current
        ) {
          return
        }

        setConversations(globals.conversations)
        conversationsLoadedRef.current = true
        queueConversationPreviewHydration(
          globals.conversations,
          requestedConversationId
        )

        if (isDraft) {
          const draftWorkspace = buildDraftWorkspaceFromGlobals(globals)

          setWorkspace(draftWorkspace)
          setMessages([])
          setMemoryPins([])
          setProblemCustomerDoc(draftWorkspace.problem_customer_doc)
          hasBootstrappedRef.current = true
          return
        }

        const bundle = await getWorkspace(
          projectPublicId,
          requestedConversationId
        )

        if (
          cancelled ||
          requestedConversationId !== activeConversationIdRef.current
        ) {
          return
        }

        hydrateWorkspace(mergeConversationWithGlobals(bundle, globals))
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
    conversationId,
    ensureProjectGlobals,
    hydrateWorkspace,
    projectPublicId,
    queueConversationPreviewHydration,
    workspaceSection,
  ])

  useEffect(() => {
    if (workspaceSection === "chat" && (conversationId || isBootstrapping)) {
      return
    }

    if (workspace) {
      return
    }

    let cancelled = false

    async function loadProjectWorkspace() {
      setIsBootstrapping(true)

      try {
        const globals = await ensureProjectGlobals()

        if (cancelled) {
          return
        }

        const draftWorkspace = buildDraftWorkspaceFromGlobals(globals)

        setWorkspace(draftWorkspace)
        setProblemCustomerDoc(draftWorkspace.problem_customer_doc)
        setMemoryPins([])
        setConversations(globals.conversations)
        conversationsLoadedRef.current = true
        hasBootstrappedRef.current = true
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load project workspace."
          )
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void loadProjectWorkspace()

    return () => {
      cancelled = true
    }
  }, [
    conversationId,
    ensureProjectGlobals,
    isBootstrapping,
    workspace,
    workspaceSection,
  ])

  const handleSelectConversation = useCallback(
    (nextConversationId: string) => {
      if (nextConversationId === conversationId) {
        return
      }

      startTransition(() => {
        router.replace(
          conversationPath(username, projectSlug, nextConversationId),
          { scroll: false }
        )
      })
    },
    [conversationId, projectSlug, router, username]
  )

  const handleNewConversation = useCallback(() => {
    if (isDraftConversationId(conversationId)) {
      setMessages([])
      setError(null)
      setIsStreaming(false)
      setActivityLabel(null)
      return
    }

    router.replace(draftConversationPath(username, projectSlug), {
      scroll: false,
    })
  }, [conversationId, projectSlug, router, username])

  const handleDeleteConversation = useCallback(
    async (targetConversationId: string) => {
      setError(null)

      try {
        await deleteConversation(projectPublicId, targetConversationId)

        setConversationPreviews((current) => {
          const next = { ...current }
          delete next[targetConversationId]
          conversationPreviewsRef.current = next
          persistConversationPreviews(projectPublicId, next)
          return next
        })

        setConversations((current) => {
          const remaining = current.filter(
            (item) => item.public_id !== targetConversationId
          )

          if (targetConversationId === activeConversationIdRef.current) {
            const next = sortConversationsByRecent(remaining)[0]

            startTransition(() => {
              router.replace(
                next
                  ? conversationPath(username, projectSlug, next.public_id)
                  : draftConversationPath(username, projectSlug),
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
    [projectPublicId, projectSlug, router, username]
  )

  const handleSend = useCallback(
    async (content: string) => {
      let sendConversationId = conversationId

      if (isDraftConversationId(conversationId)) {
        setError(null)

        try {
          const conversation = await createConversation(projectPublicId)
          sendConversationId = conversation.public_id
          skipConversationLoadRef.current = sendConversationId
          activeConversationIdRef.current = sendConversationId

          setConversations((current) =>
            sortConversationsByRecent([
              conversation,
              ...current.filter(
                (item) => item.public_id !== conversation.public_id
              ),
            ])
          )

          setWorkspace((current) =>
            current
              ? {
                  ...current,
                  conversation,
                  problem_customer_doc: {
                    ...current.problem_customer_doc,
                    conversation_id: conversation.public_id,
                  },
                }
              : current
          )

          setProblemCustomerDoc((current) =>
            current
              ? {
                  ...current,
                  conversation_id: conversation.public_id,
                }
              : current
          )

          router.replace(
            conversationPath(username, projectSlug, sendConversationId),
            {
              scroll: false,
            }
          )
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
            public_id: optimisticUserId,
            conversation_public_id: sendConversationId,
            role: "user",
            content,
            sequence: current.length + 1,
            created_at: new Date().toISOString(),
          },
          {
            public_id: optimisticAssistantId,
            conversation_public_id: sendConversationId,
            role: "assistant",
            content: "",
            sequence: current.length + 2,
            created_at: new Date().toISOString(),
            isStreaming: true,
          },
        ])
      })

      await sendChatMessage(
        projectPublicId,
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
                message.public_id === optimisticAssistantId
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
                if (message.public_id === optimisticUserId) {
                  return {
                    ...message,
                    public_id: payload.user_message_public_id,
                  }
                }

                if (message.public_id === optimisticAssistantId) {
                  return {
                    ...message,
                    public_id: payload.assistant_message_id,
                    content: streamedContent || message.content,
                    isStreaming: false,
                  }
                }

                return message
              })
            )
            assistantStreamRef.current = ""
            setMemoryPins(normalizeMemoryPins(payload.memory_pins))
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

            void listConversations(projectPublicId, { limit: 20 })
              .then((page) => {
                const sorted = sortConversationsByRecent(page.items)
                setConversations(sorted)
                conversationsLoadedRef.current = true
              })
              .catch(() => {
                // Sidebar order can stay stale if list refresh fails.
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
              current.filter(
                (message) => message.public_id !== optimisticAssistantId
              )
            )
          },
        },
        chatAbortRef.current?.signal
      )
    },
    [
      conversationId,
      projectPublicId,
      projectSlug,
      username,
      rememberConversationPreview,
      router,
    ]
  )

  const refreshCaptureState = useCallback(async () => {
    const [nextPins, nextCompanyMap, nextArtifactHub] = await Promise.all([
      listPins(projectPublicId),
      getCompanyMap(projectPublicId),
      listArtifacts(projectPublicId),
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
  }, [projectPublicId])

  const handleIngestionConversationCreated = useCallback(
    async (newConversationId: string) => {
      skipConversationLoadRef.current = newConversationId
      activeConversationIdRef.current = newConversationId

      router.replace(
        conversationPath(username, projectSlug, newConversationId),
        {
          scroll: false,
        }
      )

      const nextWorkspace = await getWorkspace(
        projectPublicId,
        newConversationId
      )
      hydrateWorkspace(nextWorkspace)

      setConversations((current) =>
        sortConversationsByRecent([
          nextWorkspace.conversation,
          ...current.filter((item) => item.public_id !== newConversationId),
        ])
      )
    },
    [hydrateWorkspace, projectPublicId, projectSlug, router, username]
  )

  const handleIngestionApplySuccess = useCallback(
    async (result: ApplyIngestionResponse) => {
      setMemoryPins(result.memory_pins)
      setProblemCustomerDoc(result.problem_customer_doc)
      setWorkspace((current) =>
        current
          ? {
              ...current,
              memory_pins: result.memory_pins,
              problem_customer_doc: result.problem_customer_doc,
            }
          : current
      )
      await refreshCaptureState()
      setIngestionDialogOpen(false)
    },
    [refreshCaptureState]
  )

  const ingestion = useIngestionFlow({
    projectId: projectPublicId,
    conversationId,
    onConversationCreated: handleIngestionConversationCreated,
    onApplySuccess: handleIngestionApplySuccess,
    onActivityLabel: setActivityLabel,
    onError: (message) => {
      setError(message)
      setIngestionDialogOpen(true)
    },
  })

  const handleConfirmPin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.public_id)
      setError(null)
      try {
        await confirmPin(projectPublicId, pin.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const handleEditPin = useCallback(
    async (pin: MemoryPinRead, content: string) => {
      setPendingPinId(pin.public_id)
      setError(null)
      try {
        await updatePin(projectPublicId, pin.public_id, {
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
        throw actionError
      } finally {
        setPendingPinId(null)
      }
    },
    [projectPublicId, refreshCaptureState]
  )

  const handleArchivePin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.public_id)
      setError(null)
      try {
        await archivePin(projectPublicId, pin.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const handlePromotePin = useCallback(
    async (pin: MemoryPinRead) => {
      setPendingPinId(pin.public_id)
      setError(null)
      try {
        await promotePin(projectPublicId, pin.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const handleAcceptCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await acceptCandidate(projectPublicId, candidate.public_id)
        setStaleCandidateId(null)
        await refreshCaptureState()
      } catch (actionError) {
        if (actionError instanceof ApiError && actionError.status === 409) {
          await refreshCaptureState()
          setStaleCandidateId(candidate.public_id)
        }
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not accept candidate."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectPublicId, refreshCaptureState]
  )

  const handleReplaceCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead, expectedRevisionId: string) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await acceptCandidate(projectPublicId, candidate.public_id, {
          allow_replace: true,
          expected_revision_id: expectedRevisionId,
        })
        setStaleCandidateId(null)
        await refreshCaptureState()
      } catch (actionError) {
        if (actionError instanceof ApiError && actionError.status === 409) {
          await refreshCaptureState()
          setStaleCandidateId(candidate.public_id)
        }
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not replace current field."
        )
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectPublicId, refreshCaptureState]
  )

  const handleEditAcceptCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead, value: string) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await editAcceptCandidate(projectPublicId, candidate.public_id, value)
        setStaleCandidateId(null)
        await refreshCaptureState()
      } catch (actionError) {
        if (actionError instanceof ApiError && actionError.status === 409) {
          await refreshCaptureState()
          setStaleCandidateId(candidate.public_id)
        }
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not accept edited candidate."
        )
        throw actionError
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectPublicId, refreshCaptureState]
  )

  const handleEditReplaceCandidate = useCallback(
    async (
      candidate: CompanyMapCandidateRead,
      value: string,
      expectedRevisionId: string
    ) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await editAcceptCandidate(projectPublicId, candidate.public_id, value, {
          allow_replace: true,
          expected_revision_id: expectedRevisionId,
        })
        setStaleCandidateId(null)
        await refreshCaptureState()
      } catch (actionError) {
        if (actionError instanceof ApiError && actionError.status === 409) {
          await refreshCaptureState()
          setStaleCandidateId(candidate.public_id)
        }
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not replace current field with edited candidate."
        )
        throw actionError
      } finally {
        setPendingCandidateId(null)
      }
    },
    [projectPublicId, refreshCaptureState]
  )

  const handleRejectCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await rejectCandidate(projectPublicId, candidate.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const handleArchiveCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await archiveCandidate(projectPublicId, candidate.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const handleClarifyCandidate = useCallback(
    async (candidate: CompanyMapCandidateRead) => {
      setPendingCandidateId(candidate.public_id)
      setError(null)
      try {
        await clarifyCandidate(projectPublicId, candidate.public_id)
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
    [projectPublicId, refreshCaptureState]
  )

  const conversationItems = useMemo(() => {
    return conversations.map((conversation) => {
      const isActive = conversation.public_id === conversationId
      const activeFirstUser = isActive
        ? messages.find((message) => message.role === "user")
        : undefined
      const preview =
        activeFirstUser !== undefined
          ? truncatePreview(activeFirstUser.content)
          : (conversationPreviews[conversation.public_id] ?? null)

      return { conversation, preview }
    })
  }, [conversations, conversationId, conversationPreviews, messages])

  const gridTemplateColumns = useMemo(() => {
    const left = leftCollapsed ? LEFT_COLLAPSED : LEFT_EXPANDED
    const right = rightCollapsed ? RIGHT_COLLAPSED : RIGHT_EXPANDED
    return `${left}px minmax(0, 1fr) ${right}px`
  }, [leftCollapsed, rightCollapsed])

  const handleApplyBranchMessageView = useCallback((messageCount: number) => {
    branchViewCountRef.current = messageCount
    setMessages(
      sliceMessagesForBranchView(allMessagesRef.current, messageCount)
    )
  }, [])

  const handleApplyCheckpointSnapshot = useCallback(
    (checkpoint: Checkpoint) => {
      setMemoryPins(checkpoint.pinsSnapshot.map((pin) => ({ ...pin })))
      setProblemCustomerDoc({
        ...checkpoint.docSnapshot,
        checklist: { ...checkpoint.docSnapshot.checklist },
      })
      handleApplyBranchMessageView(checkpoint.messageCount)
    },
    [handleApplyBranchMessageView]
  )

  const handleNavigateToCheckpoint = useCallback(
    (checkpoint: Checkpoint) => {
      pendingCheckpointRestoreRef.current = checkpoint
      branchViewCountRef.current = checkpoint.messageCount

      if (checkpoint.conversationId === conversationId) {
        handleApplyCheckpointSnapshot(checkpoint)
        pendingCheckpointRestoreRef.current = null
        return
      }

      handleSelectConversation(checkpoint.conversationId)
    },
    [conversationId, handleApplyCheckpointSnapshot, handleSelectConversation]
  )

  if (isBootstrapping) {
    return <WorkspaceLayoutSkeleton />
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

  const activeProblemCustomerDoc =
    problemCustomerDoc ?? workspace?.problem_customer_doc ?? null

  if (!workspace || !activeProblemCustomerDoc) {
    return <WorkspaceLayoutSkeleton />
  }

  const navConversationId =
    conversationId && !isDraftConversationId(conversationId)
      ? conversationId
      : (conversations[0]?.public_id ?? conversationId)

  return (
    <IdeaHistoryProvider
      projectId={projectPublicId}
      conversationId={navConversationId}
      pins={memoryPins}
      doc={activeProblemCustomerDoc}
      messageCount={messages.length}
      onApplyBranchMessageView={handleApplyBranchMessageView}
      onApplyCheckpointSnapshot={handleApplyCheckpointSnapshot}
      onNavigateConversation={handleSelectConversation}
      onNavigateToCheckpoint={handleNavigateToCheckpoint}
    >
      <WorkspaceShellLayout
        username={username}
        projectSlug={projectSlug}
        workspaceSection={workspaceSection}
        navConversationId={navConversationId}
        workspace={workspace}
        conversationId={conversationId}
        conversationItems={conversationItems}
        messages={messages}
        memoryPins={memoryPins}
        problemCustomerDoc={activeProblemCustomerDoc}
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
        staleCandidateId={staleCandidateId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSend={handleSend}
        onConfirmPin={handleConfirmPin}
        onEditPin={handleEditPin}
        onArchivePin={handleArchivePin}
        onPromotePin={handlePromotePin}
        onAcceptCandidate={handleAcceptCandidate}
        onReplaceCandidate={handleReplaceCandidate}
        onEditAcceptCandidate={handleEditAcceptCandidate}
        onEditReplaceCandidate={handleEditReplaceCandidate}
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
        onOpenIngestion={() => setIngestionDialogOpen(true)}
        onImportFiles={async (files) => {
          await ingestion.startFilesIngestion(files)
        }}
        isIngestionBusy={ingestion.isBusy}
      />

      <IngestionDialog
        open={ingestionDialogOpen}
        projectId={projectPublicId}
        disabled={ingestion.isBusy}
        error={ingestion.error}
        onOpenChange={(open) => {
          setIngestionDialogOpen(open)

          if (!open && !ingestion.isBusy && ingestion.phase !== "preview") {
            ingestion.reset()
          }
        }}
        onUploadFiles={async (files) => {
          setIngestionDialogOpen(false)
          await ingestion.startFilesIngestion(files)
        }}
        onSubmitPaste={async (text, sourceType) => {
          setIngestionDialogOpen(false)
          await ingestion.startPasteIngestion(text, sourceType)
        }}
        onSelectExportConversation={async (transcript, provider, exportId) => {
          setIngestionDialogOpen(false)
          await ingestion.startExportIngestion(transcript, provider, exportId)
        }}
        onSubmitMemoryPaste={async (text) => {
          setIngestionDialogOpen(false)
          await ingestion.startPasteIngestion(text, "ai_memory_export")
        }}
      />

      <IngestionPreviewDialog
        open={ingestion.phase === "preview" || ingestion.phase === "applying"}
        preview={ingestion.preview}
        importCount={ingestion.importCount}
        isApplying={ingestion.phase === "applying"}
        error={ingestion.error}
        onOpenChange={(open) => {
          if (!open) {
            ingestion.reset()
          }
        }}
        onApply={ingestion.applyPreview}
        onDiscard={() => ingestion.reset()}
      />
    </IdeaHistoryProvider>
  )
}

type WorkspaceShellLayoutProps = {
  username: string
  projectSlug: string
  workspaceSection: ReturnType<typeof resolveProjectWorkspaceSection>
  navConversationId: string
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
  staleCandidateId: string | null
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
  onReplaceCandidate: (
    candidate: CompanyMapCandidateRead,
    expectedRevisionId: string
  ) => void | Promise<void>
  onEditAcceptCandidate: (
    candidate: CompanyMapCandidateRead,
    value: string
  ) => void | Promise<void>
  onEditReplaceCandidate: (
    candidate: CompanyMapCandidateRead,
    value: string,
    expectedRevisionId: string
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
  onOpenIngestion: () => void
  onImportFiles: (files: File[]) => void | Promise<void>
  isIngestionBusy: boolean
}

function WorkspaceShellLayout({
  username,
  projectSlug,
  workspaceSection,
  navConversationId,
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
  staleCandidateId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onSend,
  onConfirmPin,
  onEditPin,
  onArchivePin,
  onPromotePin,
  onAcceptCandidate,
  onReplaceCandidate,
  onEditAcceptCandidate,
  onEditReplaceCandidate,
  onRejectCandidate,
  onArchiveCandidate,
  onClarifyCandidate,
  onToggleLeftCollapse,
  onToggleRightCollapse,
  onExpandRightSidebar,
  onToggleMobileContext,
  onExpandMobileContext,
  onSidebarViewChange,
  onOpenIngestion,
  onImportFiles,
  isIngestionBusy,
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
    isHistoryLoading,
    historyError,
    retryHistoryLoad,
    openOneOff,
    closeOneOff,
    sendOneOffQuestion,
    openBranchDialog,
    selectGraphNode,
    state,
  } = useIdeaHistory()
  const router = useRouter()
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
    router.push(conversationPath(username, projectSlug, navConversationId))
  }

  function handleInspectCandidateSource() {
    router.push(conversationPath(username, projectSlug, navConversationId))
  }

  function handleSelectPinField(field: CompanyMapFieldRead) {
    setSelectedFieldKey(field.key)
    router.push(companyMapPath(username, projectSlug))
  }

  function handleSelectGraphNode(node: GitGraphNode) {
    router.push(conversationPath(username, projectSlug, navConversationId))
    void selectGraphNode(node)
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
              activeConversationId={navConversationId}
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
              onSelectGraphNode={handleSelectGraphNode}
              getGraphNodeInsight={getNodeInsight}
              isHistoryLoading={isHistoryLoading}
              historyError={historyError}
              onRetryHistory={retryHistoryLoad}
              collapsed={leftCollapsed}
              onToggleCollapse={onToggleLeftCollapse}
            />
          </CollapsibleSidebar>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {isConversationLoading && workspaceSection === "chat" ? (
            <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader2
                className="text-muted-foreground size-5 animate-spin"
                aria-hidden="true"
              />
              <span className="sr-only">Loading conversation</span>
            </div>
          ) : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ProjectWorkspaceNav
              username={username}
              projectSlug={projectSlug}
              activeConversationId={navConversationId}
            />
            {workspaceSection === "company-map" ? (
              <CompanyMapPanel
                companyMap={workspace.company_map}
                selectedFieldKey={selectedField?.key ?? null}
                pendingCandidateId={pendingCandidateId}
                staleCandidateId={staleCandidateId}
                onSelectField={(field) => {
                  setSelectedFieldKey(field.key)
                }}
                onAcceptCandidate={onAcceptCandidate}
                onReplaceCandidate={onReplaceCandidate}
                onEditAcceptCandidate={onEditAcceptCandidate}
                onEditReplaceCandidate={onEditReplaceCandidate}
                onRejectCandidate={onRejectCandidate}
                onArchiveCandidate={onArchiveCandidate}
                onClarifyCandidate={onClarifyCandidate}
                onInspectCandidateSource={handleInspectCandidateSource}
              />
            ) : null}
            {workspaceSection === "artifacts" ? (
              <ArtifactHubPanel
                artifactHub={workspace.artifact_hub}
                selectedArtifactId={selectedArtifact?.id ?? null}
                onSelectArtifact={(artifact) => {
                  setSelectedArtifactId(artifact.id)
                }}
              />
            ) : null}
            {workspaceSection === "chat" ? (
              <>
                {!isDraftConversation ? <CheckpointToolbar /> : null}
                <ChatPanel
                  messages={messages}
                  activityLabel={activityLabel}
                  isStreaming={isStreaming || isIngestionBusy}
                  error={error}
                  onSend={onSend}
                  onOpenIngestion={onOpenIngestion}
                  onImportFiles={onImportFiles}
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
