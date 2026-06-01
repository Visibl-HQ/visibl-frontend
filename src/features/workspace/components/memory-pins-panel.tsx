import { useState } from "react"
import {
  Archive,
  Check,
  Link2,
  MessageSquareText,
  Pencil,
  Pin,
  StickyNote,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { CompanyMapFieldRead, MemoryPinRead } from "@/lib/api/types"

type MemoryPinsPanelProps = {
  pins: MemoryPinRead[]
  fields?: CompanyMapFieldRead[]
  pendingPinId?: string | null
  onConfirm?: ((pin: MemoryPinRead) => void | Promise<void>) | undefined
  onEdit?:
    | ((pin: MemoryPinRead, content: string) => void | Promise<void>)
    | undefined
  onArchive?: ((pin: MemoryPinRead) => void | Promise<void>) | undefined
  onPromote?: ((pin: MemoryPinRead) => void | Promise<void>) | undefined
  onInspectSource?: ((pin: MemoryPinRead) => void) | undefined
  onSelectField?: ((field: CompanyMapFieldRead) => void) | undefined
}

function isMetricPayload(
  pin: MemoryPinRead
): pin is MemoryPinRead & { payload: { value: string; label: string } } {
  return pin.pin_type === "metric"
}

function getPinContent(pin: MemoryPinRead): string {
  if (pin.content) {
    return pin.content
  }
  if (isMetricPayload(pin)) {
    return `${pin.payload.label}: ${pin.payload.value}`
  }
  return "content" in pin.payload ? pin.payload.content : ""
}

export function MemoryPinsPanel({
  pins,
  fields = [],
  pendingPinId = null,
  onConfirm,
  onEdit,
  onArchive,
  onPromote,
  onInspectSource,
  onSelectField,
}: MemoryPinsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftContent, setDraftContent] = useState("")

  return (
    <section className="border-border/60 bg-card/40 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Pin className="text-muted-foreground size-3.5" aria-hidden="true" />
        <h2 className="text-xs font-semibold tracking-tight">Memory pins</h2>
      </div>
      <div className="mt-3 space-y-2">
        {pins.length === 0 ? (
          <p className="text-muted-foreground text-xs leading-5">
            Key facts appear here as you talk.
          </p>
        ) : (
          pins.map((pin) => {
            const linkedField = fields.find(
              (field) => field.key === pin.field_key
            )

            return (
              <div
                key={pin.id}
                className="border-border/60 bg-muted/15 rounded-md border px-2.5 py-2"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] capitalize"
                  >
                    {pin.pin_type.replaceAll("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    {pin.status}
                  </Badge>
                </div>
                {editingId === pin.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={draftContent}
                      className="min-h-20 text-xs"
                      onChange={(event) => setDraftContent(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={
                          !onEdit ||
                          pendingPinId === pin.id ||
                          draftContent.trim().length === 0
                        }
                        onClick={async () => {
                          if (!onEdit) {
                            return
                          }

                          try {
                            await onEdit(pin, draftContent)
                            setEditingId(null)
                          } catch {
                            // The parent owns the visible error; keep the draft for retry.
                          }
                        }}
                      >
                        <Check className="size-3" aria-hidden="true" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Cancel pin edit"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isMetricPayload(pin) ? (
                      <div>
                        <p className="text-base font-semibold tabular-nums">
                          {pin.payload.value}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {pin.payload.label}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <StickyNote
                          className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-xs leading-5">
                          {getPinContent(pin)}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pin.status !== "confirmed" ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Confirm pin"
                          disabled={pendingPinId === pin.id}
                          onClick={() => onConfirm?.(pin)}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Edit pin"
                        disabled={pendingPinId === pin.id}
                        onClick={() => {
                          setEditingId(pin.id)
                          setDraftContent(getPinContent(pin))
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={pendingPinId === pin.id}
                        onClick={() => onPromote?.(pin)}
                      >
                        Promote
                      </Button>
                      {pin.source_message_id ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Open chat context for source message"
                          title="Open chat context"
                          onClick={() => onInspectSource?.(pin)}
                        >
                          <MessageSquareText
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      ) : null}
                      {pin.source_document_id || pin.source_document_label ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Open chat context for source document${pin.source_document_label ? `: ${pin.source_document_label}` : ""}`}
                          title="Open chat context"
                          onClick={() => onInspectSource?.(pin)}
                        >
                          <MessageSquareText
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      ) : null}
                      {linkedField ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 max-w-full text-xs"
                          onClick={() => onSelectField?.(linkedField)}
                        >
                          <Link2 className="size-3.5" aria-hidden="true" />
                          <span className="truncate">{linkedField.label}</span>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Archive pin"
                        disabled={pendingPinId === pin.id}
                        onClick={() => onArchive?.(pin)}
                      >
                        <Archive className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
