"use client"

import { AlertCircle, Loader2, Pin, StickyNote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { IngestionPreview } from "@/lib/api/types"
import { CHECKLIST_SECTIONS } from "@/features/workspace/data/checklist-sections"

type IngestionPreviewDialogProps = {
  open: boolean
  preview: IngestionPreview | null
  importCount?: number
  isApplying: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onApply: () => void | Promise<void>
  onDiscard: () => void
}

const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
} as const

function getSectionLabel(sectionKey: string): string {
  return (
    CHECKLIST_SECTIONS.find((section) => section.key === sectionKey)?.label ??
    sectionKey.replaceAll("_", " ")
  )
}

function getPinPreviewText(
  pin: IngestionPreview["proposed_pins"][number]
): string {
  if (pin.pin_type === "metric") {
    return `${pin.label ?? "Metric"}: ${pin.value ?? ""}`.trim()
  }

  return pin.content ?? pin.label ?? "Note"
}

export function IngestionPreviewDialog({
  open,
  preview,
  importCount = 1,
  isApplying,
  error,
  onOpenChange,
  onApply,
  onDiscard,
}: IngestionPreviewDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (isApplying) {
      return
    }

    if (!nextOpen) {
      onDiscard()
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-4 pt-4">
          <DialogHeader>
            <DialogTitle>Review import preview</DialogTitle>
            <DialogDescription>
              Visibl read your import and proposed memory pins plus
              problem/customer doc updates. Apply to save them in the workspace,
              or discard to cancel.
            </DialogDescription>
          </DialogHeader>
        </div>

        {preview ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {importCount > 1 ? (
                  <Badge variant="outline">
                    {importCount} imports combined
                  </Badge>
                ) : null}
                <Badge variant="secondary">
                  {CONFIDENCE_LABELS[preview.confidence]}
                </Badge>
                <Badge variant="outline">
                  {preview.proposed_pins.length} pin
                  {preview.proposed_pins.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline">
                  {preview.proposed_doc_sections.length} doc section
                  {preview.proposed_doc_sections.length === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm leading-6">
                {preview.summary}
              </div>

              {preview.proposed_pins.length > 0 ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-medium">Proposed pins</h3>
                  <ul className="grid gap-2">
                    {preview.proposed_pins.map((pin, index) => (
                      <li
                        key={`${pin.pin_type}-${index}`}
                        className="bg-muted/30 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                      >
                        {pin.pin_type === "metric" ? (
                          <Pin
                            className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <StickyNote
                            className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium capitalize">
                            {pin.pin_type}
                          </p>
                          <p className="text-muted-foreground mt-0.5 leading-5">
                            {getPinPreviewText(pin)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {preview.proposed_doc_sections.length > 0 ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-medium">Proposed doc sections</h3>
                  <ul className="grid gap-2">
                    {preview.proposed_doc_sections.map((section) => (
                      <li
                        key={section.section}
                        className="bg-muted/30 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {getSectionLabel(section.section)}
                          </span>
                          <Badge
                            variant={section.done ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {section.done ? "Done" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 leading-5">
                          {section.summary}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="bg-destructive/10 text-destructive mx-4 mb-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>{error}</p>
          </div>
        ) : null}

        <DialogFooter className="relative z-10 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={isApplying}
            onClick={() => handleOpenChange(false)}
          >
            Discard
          </Button>
          <Button
            type="button"
            disabled={isApplying || !preview}
            onClick={() => void onApply()}
          >
            {isApplying ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Applying…
              </>
            ) : (
              "Apply to workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
