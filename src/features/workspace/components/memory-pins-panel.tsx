import { Pin, StickyNote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MemoryPinRead } from "@/lib/api/types"

type MemoryPinsPanelProps = {
  pins: MemoryPinRead[]
}

function isMetricPayload(
  pin: MemoryPinRead
): pin is MemoryPinRead & { payload: { value: string; label: string } } {
  return pin.pin_type === "metric"
}

export function MemoryPinsPanel({ pins }: MemoryPinsPanelProps) {
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
          pins.map((pin) => (
            <div
              key={pin.id}
              className="border-border/60 bg-muted/15 rounded-md border px-2.5 py-2"
            >
              <Badge
                variant="secondary"
                className="mb-1.5 h-5 px-1.5 text-[10px] capitalize"
              >
                {pin.pin_type}
              </Badge>
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
                    {"content" in pin.payload ? pin.payload.content : ""}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
