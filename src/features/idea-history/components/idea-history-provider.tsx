"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { MemoryPinRead, ProblemCustomerDocRead } from "@/lib/api/types"
import { ApiError } from "@/lib/api/client"
import * as ideaHistoryApi from "@/lib/api/idea-history"
import {
  adaptBinding,
  adaptBootstrap,
  adaptCheckpoint,
  adaptOneOffSession,
  applyBindingUpdate,
  applyCheckpointCreated,
  applyCreateBranchResponse,
  applyMergeBranchResponse,
  checkpointForRestore,
  setConversationBinding,
  upsertOneOffSession,
} from "@/features/idea-history/lib/api-adapters"
import {
  computeDirtyChanges,
  hasDirtyChanges,
} from "@/features/idea-history/lib/dirty-state"
import { buildGraphLayout } from "@/features/idea-history/lib/graph-layout"
import {
  createInitialHistoryState,
  ensureConversationBinding,
  getBranchById,
  getHeadCheckpoint,
  getMainBranch,
  resolveConversationBinding,
} from "@/features/idea-history/lib/history-state"
import type {
  Branch,
  Checkpoint,
  ConversationBinding,
  DirtyChange,
  OneOffSession,
  ProjectHistoryState,
} from "@/features/idea-history/types"
import type { GitGraphNode } from "@/features/workspace/data/demo-git-graph"
import type { GraphConnection } from "@/features/idea-history/lib/graph-layout"
import { isDraftConversationId } from "@/features/workspace/lib/conversation-routing"

type IdeaHistoryContextValue = {
  state: ProjectHistoryState
  activeBranch: Branch | undefined
  activeBinding: ConversationBinding
  headCheckpoint: Checkpoint | undefined
  isOnMain: boolean
  dirtyChanges: DirtyChange[]
  isDirty: boolean
  canBranch: boolean
  canMergeCurrentBranch: boolean
  graphNodes: GitGraphNode[]
  graphConnections: GraphConnection[]
  graphLaneCount: number
  isHistoryLoading: boolean
  historyError: string | null
  isActionPending: boolean
  actionError: string | null
  oneOffOpen: boolean
  oneOffSession: OneOffSession | null
  branchSuggestedName: string
  branchDialogOpen: boolean
  clearActionError: () => void
  openOneOff: () => void
  closeOneOff: () => void
  sendOneOffQuestion: (question: string) => Promise<void>
  openBranchDialog: (suggestedName?: string) => void
  setBranchDialogOpen: (open: boolean) => void
  commitCheckpoint: (input: {
    title: string
    note?: string
  }) => Promise<boolean>
  createBranch: (input: {
    name: string
    fromCheckpointId: string
  }) => Promise<string | null>
  switchBranch: (branchId: string) => Promise<void>
  selectGraphNode: (node: GitGraphNode) => Promise<void>
  mergeBranchToMain: (branchId: string) => Promise<boolean>
  registerConversation: (conversationId: string) => void
}

const IdeaHistoryContext = createContext<IdeaHistoryContextValue | null>(null)

type IdeaHistoryProviderProps = {
  projectId: string
  conversationId: string
  pins: MemoryPinRead[]
  doc: ProblemCustomerDocRead
  messageCount: number
  onApplyCheckpointSnapshot?: (checkpoint: Checkpoint) => void
  onNavigateConversation?: (conversationId: string) => void
  children: React.ReactNode
}

function cloneCheckpointSnapshot(checkpoint: Checkpoint): Checkpoint {
  return {
    ...checkpoint,
    pinsSnapshot: checkpoint.pinsSnapshot.map((pin) => ({ ...pin })),
    docSnapshot: {
      ...checkpoint.docSnapshot,
      checklist: { ...checkpoint.docSnapshot.checklist },
    },
  }
}

function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function IdeaHistoryProvider({
  projectId,
  conversationId,
  pins,
  doc,
  messageCount,
  onApplyCheckpointSnapshot,
  onNavigateConversation,
  children,
}: IdeaHistoryProviderProps) {
  const [state, setState] = useState<ProjectHistoryState>(() =>
    createInitialHistoryState()
  )
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [oneOffOpen, setOneOffOpen] = useState(false)
  const [oneOffSession, setOneOffSession] = useState<OneOffSession | null>(null)
  const [branchSuggestedName, setBranchSuggestedName] = useState("explore")
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const clearActionError = useCallback(() => {
    setActionError(null)
  }, [])

  const applyRestore = useCallback(
    (response: {
      checkpoint: Parameters<typeof checkpointForRestore>[0]
      restore: Parameters<typeof checkpointForRestore>[1]
    }) => {
      const checkpoint = checkpointForRestore(
        response.checkpoint,
        response.restore
      )

      if (checkpoint) {
        onApplyCheckpointSnapshot?.(cloneCheckpointSnapshot(checkpoint))
      }
    },
    [onApplyCheckpointSnapshot]
  )

  useEffect(() => {
    let cancelled = false

    async function hydrateHistory() {
      setIsHistoryLoading(true)
      setHistoryError(null)

      try {
        const bootstrap = await ideaHistoryApi.fetchIdeaHistory(projectId)

        if (!cancelled) {
          setState(adaptBootstrap(bootstrap))
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(formatApiError(error, "Could not load idea history."))
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false)
        }
      }
    }

    void hydrateHistory()

    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    if (
      !conversationId ||
      isDraftConversationId(conversationId) ||
      isHistoryLoading
    ) {
      return
    }

    if (state.conversationBindings[conversationId]) {
      return
    }

    let cancelled = false

    async function registerBinding() {
      try {
        const binding = await ideaHistoryApi.fetchBinding(
          projectId,
          conversationId
        )

        if (!cancelled) {
          setState((current) =>
            setConversationBinding(current, adaptBinding(binding))
          )
        }
      } catch {
        // Binding may already exist from bootstrap; ignore fetch errors here.
      }
    }

    void registerBinding()

    return () => {
      cancelled = true
    }
  }, [conversationId, isHistoryLoading, projectId, state.conversationBindings])

  const activeBinding = resolveConversationBinding(state, conversationId)
  const activeBranch =
    getBranchById(state, activeBinding.branchId) ?? getMainBranch(state)
  const headCheckpoint = activeBranch
    ? getHeadCheckpoint(state, activeBranch.id)
    : undefined
  const isOnMain = activeBranch?.id === state.mainBranchId

  const baselineCheckpoint = useMemo(() => {
    if (!activeBinding?.lastCheckpointId) {
      return headCheckpoint ?? null
    }

    return (
      state.checkpoints.find(
        (checkpoint) => checkpoint.id === activeBinding.lastCheckpointId
      ) ??
      headCheckpoint ??
      null
    )
  }, [activeBinding, headCheckpoint, state.checkpoints])

  const dirtyChanges = useMemo(
    () =>
      computeDirtyChanges({
        baseline: baselineCheckpoint,
        pins,
        doc,
        messageCount,
      }),
    [baselineCheckpoint, pins, doc, messageCount]
  )

  const isDirty = hasDirtyChanges(dirtyChanges)
  const canBranch = Boolean(headCheckpoint && !isDirty)
  const canMergeCurrentBranch = Boolean(
    activeBranch && !isOnMain && activeBranch.headCheckpointId
  )

  const graphLayout = useMemo(() => buildGraphLayout(state), [state])

  const registerConversation = useCallback((nextConversationId: string) => {
    setState((current) =>
      ensureConversationBinding(current, nextConversationId)
    )
  }, [])

  const openOneOff = useCallback(() => {
    setOneOffSession(null)
    setOneOffOpen(true)
    setActionError(null)
  }, [])

  const closeOneOff = useCallback(() => {
    setOneOffOpen(false)
  }, [])

  const openBranchDialog = useCallback((suggestedName?: string) => {
    if (suggestedName?.trim()) {
      setBranchSuggestedName(suggestedName.trim())
    }

    setActionError(null)
    setBranchDialogOpen(true)
  }, [])

  const sendOneOffQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim()

      if (!trimmed || !conversationId) {
        return
      }

      setIsActionPending(true)
      setActionError(null)

      try {
        if (oneOffSession) {
          const updated = await ideaHistoryApi.sendOneOffMessage(
            projectId,
            oneOffSession.id,
            trimmed
          )
          const session = adaptOneOffSession(updated)

          setOneOffSession(session)
          setState((current) => upsertOneOffSession(current, session))
        } else {
          const created = await ideaHistoryApi.createOneOffSession(projectId, {
            question: trimmed,
            fork_checkpoint_id: headCheckpoint?.id ?? null,
            conversation_id: conversationId,
          })
          const session = adaptOneOffSession(created)

          setOneOffSession(session)
          setState((current) => upsertOneOffSession(current, session))
        }
      } catch (error) {
        setActionError(
          formatApiError(error, "Could not send exploration question.")
        )
      } finally {
        setIsActionPending(false)
      }
    },
    [conversationId, headCheckpoint, oneOffSession, projectId]
  )

  const commitCheckpoint = useCallback(
    async ({ title, note }: { title: string; note?: string }) => {
      if (!activeBranch || !conversationId) {
        return false
      }

      setIsActionPending(true)
      setActionError(null)

      try {
        const checkpoint = await ideaHistoryApi.createCheckpoint(projectId, {
          branch_id: activeBranch.id,
          conversation_id: conversationId,
          title: title.trim(),
          ...(note?.trim() ? { note: note.trim() } : {}),
        })

        setState((current) => applyCheckpointCreated(current, checkpoint))
        onApplyCheckpointSnapshot?.(
          cloneCheckpointSnapshot(adaptCheckpoint(checkpoint))
        )

        return true
      } catch (error) {
        setActionError(formatApiError(error, "Could not create checkpoint."))
        return false
      } finally {
        setIsActionPending(false)
      }
    },
    [activeBranch, conversationId, onApplyCheckpointSnapshot, projectId]
  )

  const updateBindingAndApply = useCallback(
    async (
      branchId: string,
      checkpointId?: string | null,
      targetConversationId = conversationId
    ) => {
      if (!targetConversationId) {
        return null
      }

      const response = await ideaHistoryApi.updateBinding(
        projectId,
        targetConversationId,
        {
          branch_id: branchId,
          ...(checkpointId !== undefined
            ? { checkpoint_id: checkpointId }
            : {}),
        }
      )

      setState((current) => applyBindingUpdate(current, response))
      applyRestore(response)

      return response
    },
    [applyRestore, conversationId, projectId]
  )

  const switchBranch = useCallback(
    async (branchId: string) => {
      if (!conversationId) {
        return
      }

      setIsActionPending(true)
      setActionError(null)

      try {
        await updateBindingAndApply(branchId)
      } catch (error) {
        setActionError(formatApiError(error, "Could not switch branch."))
      } finally {
        setIsActionPending(false)
      }
    },
    [conversationId, updateBindingAndApply]
  )

  const createBranch = useCallback(
    async ({
      name,
      fromCheckpointId,
    }: {
      name: string
      fromCheckpointId: string
    }) => {
      if (!canBranch || !conversationId) {
        return null
      }

      setIsActionPending(true)
      setActionError(null)

      try {
        const response = await ideaHistoryApi.createBranch(projectId, {
          name: name.trim(),
          from_checkpoint_id: fromCheckpointId,
          conversation_id: conversationId,
        })

        setState((current) => applyCreateBranchResponse(current, response))

        const forkCheckpoint = stateRef.current.checkpoints.find(
          (item) => item.id === fromCheckpointId
        )

        applyRestore({
          checkpoint: forkCheckpoint
            ? {
                id: forkCheckpoint.id,
                branch_id: forkCheckpoint.branchId,
                conversation_id: forkCheckpoint.conversationId,
                title: forkCheckpoint.title,
                note: forkCheckpoint.note ?? null,
                created_at: forkCheckpoint.createdAt,
                pins_snapshot: forkCheckpoint.pinsSnapshot,
                doc_snapshot: forkCheckpoint.docSnapshot,
                message_count: forkCheckpoint.messageCount,
                parent_checkpoint_id: forkCheckpoint.parentCheckpointId,
              }
            : null,
          restore: response.restore,
        })

        return response.branch.id
      } catch (error) {
        setActionError(formatApiError(error, "Could not create branch."))
        return null
      } finally {
        setIsActionPending(false)
      }
    },
    [applyRestore, canBranch, conversationId, projectId]
  )

  const selectGraphNode = useCallback(
    async (node: GitGraphNode) => {
      if (
        (node.kind === "commit" || node.kind === "merge") &&
        node.checkpointId
      ) {
        const checkpoint = stateRef.current.checkpoints.find(
          (item) => item.id === node.checkpointId
        )

        if (!checkpoint) {
          return
        }

        setIsActionPending(true)
        setActionError(null)

        try {
          const targetConversationId =
            checkpoint.conversationId || conversationId

          await updateBindingAndApply(
            checkpoint.branchId,
            checkpoint.id,
            targetConversationId
          )

          if (
            checkpoint.conversationId &&
            checkpoint.conversationId !== conversationId
          ) {
            onNavigateConversation?.(checkpoint.conversationId)
          }
        } catch (error) {
          setActionError(formatApiError(error, "Could not open checkpoint."))
        } finally {
          setIsActionPending(false)
        }

        return
      }

      if (node.kind === "branch" && node.branchId) {
        setIsActionPending(true)
        setActionError(null)

        try {
          await updateBindingAndApply(node.branchId)

          if (node.conversationId && node.conversationId !== conversationId) {
            onNavigateConversation?.(node.conversationId)
          }
        } catch (error) {
          setActionError(formatApiError(error, "Could not switch branch."))
        } finally {
          setIsActionPending(false)
        }
      }
    },
    [conversationId, onNavigateConversation, updateBindingAndApply]
  )

  const mergeBranchToMain = useCallback(
    async (branchId: string) => {
      if (!conversationId) {
        return false
      }

      const branch = getBranchById(stateRef.current, branchId)
      const main = getMainBranch(stateRef.current)

      if (!branch || branch.id === main.id || !branch.headCheckpointId) {
        return false
      }

      setIsActionPending(true)
      setActionError(null)

      try {
        const response = await ideaHistoryApi.mergeBranch(projectId, branchId, {
          conversation_id: conversationId,
        })

        setState((current) => applyMergeBranchResponse(current, response))
        applyRestore({
          checkpoint: response.merge_checkpoint,
          restore: response.restore,
        })

        return true
      } catch (error) {
        setActionError(formatApiError(error, "Could not merge branch."))
        return false
      } finally {
        setIsActionPending(false)
      }
    },
    [applyRestore, conversationId, projectId]
  )

  const value: IdeaHistoryContextValue = {
    state,
    activeBranch,
    activeBinding,
    headCheckpoint,
    isOnMain,
    dirtyChanges,
    isDirty,
    canBranch,
    canMergeCurrentBranch,
    graphNodes: graphLayout.nodes,
    graphConnections: graphLayout.connections,
    graphLaneCount: graphLayout.laneCount,
    isHistoryLoading,
    historyError,
    isActionPending,
    actionError,
    oneOffOpen,
    oneOffSession,
    branchSuggestedName,
    branchDialogOpen,
    clearActionError,
    openOneOff,
    closeOneOff,
    sendOneOffQuestion,
    openBranchDialog,
    setBranchDialogOpen,
    commitCheckpoint,
    createBranch,
    switchBranch,
    selectGraphNode,
    mergeBranchToMain,
    registerConversation,
  }

  return (
    <IdeaHistoryContext.Provider value={value}>
      {children}
    </IdeaHistoryContext.Provider>
  )
}

export function useIdeaHistory(): IdeaHistoryContextValue {
  const context = useContext(IdeaHistoryContext)

  if (!context) {
    throw new Error("useIdeaHistory must be used within IdeaHistoryProvider.")
  }

  return context
}

export function useOptionalIdeaHistory(): IdeaHistoryContextValue | null {
  return useContext(IdeaHistoryContext)
}
