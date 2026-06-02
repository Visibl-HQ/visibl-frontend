import type { MemoryPinRead, ProblemCustomerDocRead } from "@/lib/api/types"
import type { DirtyChange } from "@/features/idea-history/types"
import type { Checkpoint } from "@/features/idea-history/types"

type DirtyInput = {
  baseline: Checkpoint | null
  pins: MemoryPinRead[]
  doc: ProblemCustomerDocRead
  messageCount: number
}

export function computeDirtyChanges({
  baseline,
  pins,
  doc,
  messageCount,
}: DirtyInput): DirtyChange[] {
  const changes: DirtyChange[] = []

  if (!baseline) {
    if (messageCount > 0) {
      changes.push({
        kind: "message",
        label: "Conversation in progress",
        detail: `${messageCount} message${messageCount === 1 ? "" : "s"} not checkpointed`,
      })
    }

    if (pins.length > 0) {
      changes.push({
        kind: "pin",
        label: "Memory pins",
        detail: `${pins.length} pin${pins.length === 1 ? "" : "s"} not checkpointed`,
      })
    }

    if (doc.completion_percentage > 0) {
      changes.push({
        kind: "doc",
        label: "Problem & customer doc",
        detail: `${Math.round(doc.completion_percentage)}% complete — not checkpointed`,
      })
    }

    return changes
  }

  const messageDelta = messageCount - baseline.messageCount

  if (messageDelta !== 0) {
    changes.push({
      kind: "message",
      label: messageDelta > 0 ? "New messages" : "Messages changed",
      detail:
        messageDelta > 0
          ? `${messageDelta} since last checkpoint`
          : `${baseline.messageCount} → ${messageCount}`,
    })
  }

  if (pins.length !== baseline.pinsSnapshot.length) {
    changes.push({
      kind: "pin",
      label: "Memory pins changed",
      detail: `${baseline.pinsSnapshot.length} → ${pins.length}`,
    })
  } else {
    const pinsChanged = pins.some((pin, index) => {
      const previous = baseline.pinsSnapshot[index]
      return (
        !previous ||
        previous.public_id !== pin.public_id ||
        JSON.stringify(previous.payload) !== JSON.stringify(pin.payload)
      )
    })

    if (pinsChanged) {
      changes.push({
        kind: "pin",
        label: "Memory pins updated",
        detail: "Pin content changed since checkpoint",
      })
    }
  }

  if (
    Math.round(doc.completion_percentage) !==
    Math.round(baseline.docSnapshot.completion_percentage)
  ) {
    changes.push({
      kind: "doc",
      label: "Problem & customer doc",
      detail: `${Math.round(baseline.docSnapshot.completion_percentage)}% → ${Math.round(doc.completion_percentage)}%`,
    })
  }

  return changes
}

export function hasDirtyChanges(changes: DirtyChange[]): boolean {
  return changes.length > 0
}
