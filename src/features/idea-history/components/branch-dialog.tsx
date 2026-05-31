"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BranchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  canBranch: boolean
  isDirty: boolean
  hasCheckpoint: boolean
  fromCheckpointTitle: string | null
  fromCheckpointId: string | null
  suggestedName?: string
  actionError: string | null
  isPending: boolean
  onClearError: () => void
  onCommitFirst: () => void
  onCreateBranch: (input: {
    name: string
    fromCheckpointId: string
  }) => Promise<string | null>
}

export function BranchDialog({
  open,
  onOpenChange,
  canBranch,
  isDirty,
  hasCheckpoint,
  fromCheckpointTitle,
  fromCheckpointId,
  suggestedName = "explore",
  actionError,
  isPending,
  onClearError,
  onCommitFirst,
  onCreateBranch,
}: BranchDialogProps) {
  const [name, setName] = useState(suggestedName)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName(suggestedName)
      onClearError()
    }

    if (nextOpen) {
      setName(suggestedName)
    }

    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canBranch || !fromCheckpointId || isPending) {
      return
    }

    const branchId = await onCreateBranch({
      name: name.trim() || suggestedName,
      fromCheckpointId,
    })

    if (branchId) {
      handleOpenChange(false)
    }
  }

  const blockedReason = !hasCheckpoint
    ? "Create at least one checkpoint before opening a branch."
    : isDirty
      ? "Commit your current changes before branching — forks start from a clean checkpoint."
      : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {blockedReason ? (
          <>
            <DialogHeader>
              <DialogTitle>Commit before branching</DialogTitle>
              <DialogDescription>{blockedReason}</DialogDescription>
            </DialogHeader>

            <div className="bg-muted/40 flex items-start gap-2 rounded-lg p-3 text-sm">
              <AlertCircle
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-xs leading-5">
                Branching requires a checkpoint and a clean working state so the
                fork captures a known snapshot of your story.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              {isDirty ? (
                <Button
                  type="button"
                  onClick={() => {
                    handleOpenChange(false)
                    onCommitFirst()
                  }}
                >
                  Checkpoint first
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Open a branch</DialogTitle>
              <DialogDescription>
                Fork from{" "}
                <span className="text-foreground font-medium">
                  {fromCheckpointTitle ?? "latest checkpoint"}
                </span>
                . The main line keeps building; this branch tracks an alternate
                path.
              </DialogDescription>
            </DialogHeader>

            {actionError ? (
              <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
                <AlertCircle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <p>{actionError}</p>
              </div>
            ) : null}

            <div className="grid gap-1.5 py-2">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="explore/pricing"
                autoFocus
                required
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!fromCheckpointId || isPending}>
                {isPending ? (
                  <>
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    Creating…
                  </>
                ) : (
                  "Create branch"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
