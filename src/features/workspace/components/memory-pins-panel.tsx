import { Pin, StickyNote } from "lucide-react"
import { AppPanel } from "@/components/marketing/app-panel"
import { SectionLabel } from "@/components/marketing/section-label"
import { Badge } from "@/components/ui/badge"
import type { MemoryPinRead } from "@/lib/api/types"

type MemoryPinsPanelProps = {
  pins: MemoryPinRead[]
}

function isMetricPayload(
  pin: MemoryPinRead,
): pin is MemoryPinRead & { payload: { value: string; label: string } } {
  return pin.pin_type === "metric"
}

export function MemoryPinsPanel({ pins }: MemoryPinsPanelProps) {
  return (
    <AppPanel className="p-4">
      <div className="flex items-center gap-2">
        <Pin className="text-muted-foreground size-4" aria-hidden="true" />
        <SectionLabel index="02">Memory pins</SectionLabel>
      </div>
      <div className="mt-4 space-y-3">
        {pins.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-6">
            Key facts will appear as you talk with the assistant.
          </p>
        ) : (
          pins.map((pin) => (
            <div
              key={pin.id}
              className="border-border/70 bg-muted/20 rounded-md border px-3 py-2.5"
            >
              <Badge variant="secondary" className="mb-2 capitalize">
                {pin.pin_type}
              </Badge>
              {isMetricPayload(pin) ? (
                <div>
                  <p className="text-lg font-semibold tabular-nums">{pin.payload.value}</p>
                  <p className="text-muted-foreground text-sm">{pin.payload.label}</p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <StickyNote
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-6">
                    {"content" in pin.payload ? pin.payload.content : ""}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppPanel>
  )
}
