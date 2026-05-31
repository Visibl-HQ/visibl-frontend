"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, GitBranch, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { OneOffSession } from "@/features/idea-history/types"
import { cn } from "@/lib/utils"

type OneOffExplorationPanelProps = {
  open: boolean
  session: OneOffSession | null
  isPending?: boolean
  actionError?: string | null
  onClose: () => void
  onAsk: (question: string) => void | Promise<void>
  onDismiss: () => void
  onPursueAsBranch: () => void
  className?: string
}

export function OneOffExplorationPanel({
  open,
  session,
  isPending = false,
  actionError = null,
  onClose,
  onAsk,
  onDismiss,
  onPursueAsBranch,
  className,
}: OneOffExplorationPanelProps) {
  const [question, setQuestion] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [session])

  if (!open) {
    return null
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = question.trim()

    if (!trimmed || isPending) {
      return
    }

    void onAsk(trimmed)
    setQuestion("")
  }

  return (
    <aside
      className={cn(
        "border-border/70 bg-background flex min-h-0 w-full shrink-0 flex-col border-l lg:w-80 xl:w-96",
        className
      )}
      aria-label="Side exploration"
    >
      <header className="border-border/70 flex shrink-0 items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles
              className="text-muted-foreground size-3.5"
              aria-hidden="true"
            />
            <h2 className="text-sm font-medium">Explore separately</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Tangents stay here — pins and your official doc are not updated.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close exploration panel"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {!session ? (
          <p className="text-muted-foreground text-xs leading-5">
            Ask a what-if or tangent. Visibl will flag what might change in your
            story if you pursued it on the main line.
          </p>
        ) : (
          <div className="space-y-4">
            {session.potentialImpacts.length > 0 ? (
              <section aria-label="Potential impacts">
                <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
                  Potential impacts
                </p>
                <ul className="space-y-2">
                  {session.potentialImpacts.map((impact) => (
                    <li
                      key={impact.field}
                      className="bg-muted/30 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={cn(
                            "size-3.5 shrink-0",
                            impact.severity === "high"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium">
                          {impact.field}
                        </span>
                        <Badge
                          variant={
                            impact.severity === "high"
                              ? "destructive"
                              : "secondary"
                          }
                          className="ml-auto h-4 px-1.5 text-[10px]"
                        >
                          {impact.severity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs leading-4">
                        {impact.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-label="Exploration messages" className="space-y-3">
              {session.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-6",
                    message.role === "user"
                      ? "bg-muted/50 ml-4"
                      : "bg-card border-border/60 mr-2 border"
                  )}
                >
                  <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </section>
          </div>
        )}
      </div>

      <footer className="border-border/70 shrink-0 space-y-3 border-t px-4 py-3">
        {actionError ? (
          <p className="text-destructive text-xs leading-5" role="alert">
            {actionError}
          </p>
        ) : null}
        {session ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onPursueAsBranch}
            >
              <GitBranch className="size-3.5" aria-hidden="true" />
              Pursue as branch
            </Button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="one-off-question" className="sr-only">
            Exploration question
          </label>
          <Textarea
            id="one-off-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What if we targeted a different customer segment?"
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!question.trim() || isPending}
          >
            {isPending ? "Sending…" : session ? "Ask another" : "Explore"}
          </Button>
        </form>
      </footer>
    </aside>
  )
}
