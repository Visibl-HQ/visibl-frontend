"use client"

import { AlertCircle, GitMerge, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Branch } from "@/features/idea-history/types"

type MergeToMainDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeBranch: Branch | null
  actionError: string | null
  isPending: boolean
  onClearError: () => void
  onMerge: (branchId: string) => Promise<boolean>
}

export function MergeToMainDialog({
  open,
  onOpenChange,
  activeBranch,
  actionError,
  isPending,
  onClearError,
  onMerge,
}: MergeToMainDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onClearError()
    }

    onOpenChange(nextOpen)
  }

  async function handleMerge() {
    if (!activeBranch || isPending) {
      return
    }

    const success = await onMerge(activeBranch.id)

    if (success) {
      handleOpenChange(false)
    }
  }

  const displayError = actionError

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge into main</DialogTitle>
          <DialogDescription>
            Bring this branch&apos;s latest checkpoint into main. Main keeps its
            history; this adds a merge checkpoint at the tip.
          </DialogDescription>
        </DialogHeader>

        {activeBranch ? (
          <div className="bg-muted/30 rounded-lg px-3 py-2.5">
            <p className="font-mono text-sm">{activeBranch.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Will merge the branch head into main, then switch you back to
              main.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-2 text-sm">
            Switch to a branch with checkpoints to merge back into main.
          </p>
        )}

        {displayError ? (
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>{displayError}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          {activeBranch ? (
            <Button
              type="button"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => void handleMerge()}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Merging…
                </>
              ) : (
                <>
                  <GitMerge className="size-4" aria-hidden="true" />
                  Merge to main
                </>
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
