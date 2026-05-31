import { FileText, MessageSquare, Pin } from "lucide-react"
import { cn } from "@/lib/utils"

const previewMessages = [
  {
    role: "user",
    text: "We help retailers cut stockouts with better demand signals.",
  },
  {
    role: "assistant",
    text: "Who feels the pain first — ops, finance, or store managers?",
  },
] as const

const previewPins = [
  { label: "ICP", value: "Mid-market retail ops" },
  { label: "Metric", value: "12 stores interviewed" },
] as const

const previewSections = [
  "Target customer",
  "Customer problem",
  "Problem severity",
] as const

export function WorkspacePreviewStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">
          Workspace preview
        </p>
        <p className="text-muted-foreground text-xs">v1 layout</p>
      </div>

      <div className="grid min-h-[280px] md:min-h-[320px] md:grid-cols-[0.9fr_1.4fr_0.9fr]">
        <div className="border-border/70 hidden border-r p-3 md:block">
          <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wide uppercase">
            Chats
          </p>
          <div className="space-y-1.5">
            {["Thread 1", "Thread 2", "Thread 3"].map((thread, index) => (
              <div
                key={thread}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs",
                  index === 2
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {thread}
              </div>
            ))}
          </div>
        </div>

        <div className="border-border/70 app-frame-bg border-r p-4 md:border-r">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="text-muted-foreground size-3.5" />
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Conversation
            </p>
          </div>
          <div className="space-y-3">
            {previewMessages.map((message) => (
              <div
                key={message.text}
                className={cn(
                  "max-w-[92%] text-xs leading-5",
                  message.role === "user"
                    ? "bg-muted/80 ml-auto w-fit rounded-2xl px-3 py-2"
                    : "text-foreground"
                )}
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden p-3 md:block">
          <div className="mb-3 flex items-center gap-2">
            <Pin className="text-muted-foreground size-3.5" />
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Context
            </p>
          </div>
          <div className="space-y-2">
            {previewPins.map((pin) => (
              <div
                key={pin.label}
                className="border-border/70 rounded-md border px-2 py-2"
              >
                <p className="text-muted-foreground text-[10px] uppercase">
                  {pin.label}
                </p>
                <p className="mt-0.5 text-xs leading-5">{pin.value}</p>
              </div>
            ))}
          </div>
          <div className="border-border/70 mt-3 rounded-md border p-2">
            <div className="mb-2 flex items-center gap-1.5">
              <FileText className="text-muted-foreground size-3.5" />
              <p className="text-[10px] font-medium">Problem & customer</p>
            </div>
            <ul className="space-y-1">
              {previewSections.map((section) => (
                <li
                  key={section}
                  className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
                >
                  <span className="border-border size-2 rounded-full border" />
                  {section}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
