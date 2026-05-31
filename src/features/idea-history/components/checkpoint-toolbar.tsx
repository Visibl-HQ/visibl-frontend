"use client"

import { useState } from "react"
import {
  Check,
  ChevronDown,
  CircleDot,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BranchDialog } from "@/features/idea-history/components/branch-dialog"
import { CommitDialog } from "@/features/idea-history/components/commit-dialog"
import { useIdeaHistory } from "@/features/idea-history/components/idea-history-provider"
import { MergeToMainDialog } from "@/features/idea-history/components/merge-to-main-dialog"
import { getActiveBranches } from "@/features/idea-history/lib/history-state"
import { slugifyBranchName } from "@/features/idea-history/lib/history-state"
import { MAIN_BRANCH_NAME } from "@/features/idea-history/types"
import { cn } from "@/lib/utils"

type CheckpointToolbarProps = {
  className?: string
}

export function CheckpointToolbar({ className }: CheckpointToolbarProps) {
  const {
    activeBranch,
    headCheckpoint,
    dirtyChanges,
    isDirty,
    canBranch,
    canMergeCurrentBranch,
    isOnMain,
    state,
    branchSuggestedName,
    branchDialogOpen,
    actionError,
    isActionPending,
    clearActionError,
    openOneOff,
    commitCheckpoint,
    createBranch,
    mergeBranchToMain,
    switchBranch,
    openBranchDialog,
    setBranchDialogOpen,
  } = useIdeaHistory()

  const [commitOpen, setCommitOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)

  const mainBranch = state.branches.find(
    (branch) => branch.id === state.mainBranchId
  )
  const otherBranches = getActiveBranches(state).filter(
    (branch) => branch.id !== state.mainBranchId
  )

  const suggestedBranchName = headCheckpoint
    ? branchSuggestedName ||
      `explore/${slugifyBranchName(headCheckpoint.title).slice(0, 24)}`
    : branchSuggestedName || "explore"

  return (
    <>
      <div
        className={cn(
          "border-border/70 bg-background/80 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 backdrop-blur-sm sm:px-4",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 max-w-[11rem] gap-1.5 px-2 font-mono text-[11px] sm:max-w-xs"
              >
                <GitBranch className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {activeBranch?.name ?? MAIN_BRANCH_NAME}
                </span>
                <ChevronDown
                  className="size-3 shrink-0 opacity-60"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-muted-foreground text-[10px] font-normal tracking-wide uppercase">
                Switch branch
              </DropdownMenuLabel>
              {mainBranch ? (
                <DropdownMenuItem
                  onClick={() => switchBranch(mainBranch.id)}
                  className="font-mono text-xs"
                >
                  <span className="flex-1 truncate">{mainBranch.name}</span>
                  {isOnMain ? (
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ) : null}
              {otherBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => switchBranch(branch.id)}
                  className="font-mono text-xs"
                >
                  <span className="flex-1 truncate">{branch.name}</span>
                  {activeBranch?.id === branch.id ? (
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openBranchDialog()}
                className="text-xs"
                disabled={!canBranch && !headCheckpoint}
              >
                Create new branch…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {headCheckpoint ? (
            <span className="text-muted-foreground truncate text-xs">
              <CircleDot
                className="mr-1 inline size-3 -translate-y-px text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              {headCheckpoint.title}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              No checkpoint yet
            </span>
          )}

          {isDirty ? (
            <Badge variant="secondary" className="text-[10px]">
              {dirtyChanges.length} uncheckpointed change
              {dirtyChanges.length === 1 ? "" : "s"}
            </Badge>
          ) : (
            <Badge
              variant="ghost"
              className="text-muted-foreground text-[10px]"
            >
              Clean
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={openOneOff}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Explore</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={!isDirty}
            onClick={() => setCommitOpen(true)}
          >
            <GitCommitHorizontal className="size-3.5" aria-hidden="true" />
            Checkpoint
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isOnMain || !canMergeCurrentBranch}
            onClick={() => setMergeOpen(true)}
            title={
              isOnMain
                ? "Switch to a branch to merge back into main"
                : "Merge this branch into main"
            }
          >
            <GitMerge className="size-3.5" aria-hidden="true" />
            Merge
          </Button>
        </div>
      </div>

      <CommitDialog
        open={commitOpen}
        onOpenChange={setCommitOpen}
        dirtyChanges={dirtyChanges}
        branchName={activeBranch?.name ?? MAIN_BRANCH_NAME}
        actionError={actionError}
        isPending={isActionPending}
        onClearError={clearActionError}
        onCommit={commitCheckpoint}
      />

      <BranchDialog
        key={branchDialogOpen ? suggestedBranchName : "closed"}
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        canBranch={canBranch}
        isDirty={isDirty}
        hasCheckpoint={Boolean(headCheckpoint)}
        fromCheckpointTitle={headCheckpoint?.title ?? null}
        fromCheckpointId={headCheckpoint?.id ?? null}
        suggestedName={suggestedBranchName}
        actionError={actionError}
        isPending={isActionPending}
        onClearError={clearActionError}
        onCommitFirst={() => {
          setBranchDialogOpen(false)
          setCommitOpen(true)
        }}
        onCreateBranch={createBranch}
      />

      <MergeToMainDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        activeBranch={isOnMain ? null : (activeBranch ?? null)}
        actionError={actionError}
        isPending={isActionPending}
        onClearError={clearActionError}
        onMerge={mergeBranchToMain}
      />
    </>
  )
}
