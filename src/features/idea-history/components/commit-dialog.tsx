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
import { Textarea } from "@/components/ui/textarea"
import type { DirtyChange } from "@/features/idea-history/types"

type CommitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dirtyChanges: DirtyChange[]
  branchName: string
  actionError: string | null
  isPending: boolean
  onClearError: () => void
  onCommit: (input: { title: string; note?: string }) => Promise<boolean>
}

export function CommitDialog({
  open,
  onOpenChange,
  dirtyChanges,
  branchName,
  actionError,
  isPending,
  onClearError,
  onCommit,
}: CommitDialogProps) {
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setTitle("")
      setNote("")
      onClearError()
    }

    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle || isPending) {
      return
    }

    const success = await onCommit({
      title: trimmedTitle,
      ...(note.trim() ? { note: note.trim() } : {}),
    })

    if (success) {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Checkpoint on {branchName}</DialogTitle>
            <DialogDescription>
              Snapshot chat, pins, and the problem doc at this moment. You can
              keep building on this line or branch from the checkpoint later.
            </DialogDescription>
          </DialogHeader>

          {dirtyChanges.length > 0 ? (
            <ul className="space-y-1.5 py-2">
              {dirtyChanges.map((change) => (
                <li
                  key={`${change.kind}-${change.label}`}
                  className="bg-muted/40 rounded-md px-2.5 py-1.5 text-xs"
                >
                  <span className="font-medium">{change.label}</span>
                  {change.detail ? (
                    <span className="text-muted-foreground ml-1.5">
                      — {change.detail}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {actionError ? (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
              <AlertCircle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <p>{actionError}</p>
            </div>
          ) : null}

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="checkpoint-title">Title</Label>
              <Input
                id="checkpoint-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. ICP narrowed to YC applicants"
                autoFocus
                required
                disabled={isPending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="checkpoint-note">Note (optional)</Label>
              <Textarea
                id="checkpoint-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What changed and why it matters"
                rows={3}
                disabled={isPending}
              />
            </div>
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
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Creating…
                </>
              ) : (
                "Create checkpoint"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
