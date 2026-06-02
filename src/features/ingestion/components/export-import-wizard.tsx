"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  FileUp,
  Loader2,
  Search,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { getImportPrompt, parseExport } from "@/lib/api/ingestion"
import type {
  ExportConversationOption,
  ExportProvider,
  ImportPromptResponse,
  ParseExportResponse,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

type ExportMode = ExportProvider | "ai_memory"

type ExportImportWizardProps = {
  projectId: string
  active?: boolean
  disabled?: boolean
  onSelectConversation: (
    transcript: string,
    provider: ExportProvider,
    conversationId: string
  ) => void | Promise<void>
  onSubmitMemoryPaste: (text: string) => void | Promise<void>
}

const MODES: Array<{ id: ExportMode; label: string }> = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "ai_memory", label: "AI memory" },
]

const PROMPT_KEY: Record<ExportMode, string> = {
  chatgpt: "chatgpt",
  claude: "claude",
  ai_memory: "generic",
}

export function ExportImportWizard({
  projectId,
  active = true,
  disabled = false,
  onSelectConversation,
  onSubmitMemoryPaste,
}: ExportImportWizardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ExportMode>("chatgpt")
  const [prompts, setPrompts] = useState<
    Partial<Record<ExportMode, ImportPromptResponse>>
  >({})
  const [promptErrors, setPromptErrors] = useState<
    Partial<Record<ExportMode, string>>
  >({})
  const [isParsing, setIsParsing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [parsedProvider, setParsedProvider] = useState<ExportProvider | null>(
    null
  )
  const [conversations, setConversations] = useState<
    ExportConversationOption[]
  >([])
  const [conversationQuery, setConversationQuery] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [memoryText, setMemoryText] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prompt = prompts[mode]
  const promptError = promptErrors[mode] ?? null
  const isLoadingPrompt =
    active && prompt === undefined && promptError === undefined

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase()

    if (!query) {
      return conversations
    }

    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(query)
    )
  }, [conversationQuery, conversations])

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  )

  const effectiveProvider =
    parsedProvider ?? (mode === "ai_memory" ? null : mode)

  useEffect(() => {
    if (!active || prompt !== undefined || promptError !== undefined) {
      return
    }

    let cancelled = false
    const promptKey = PROMPT_KEY[mode]

    void getImportPrompt(projectId, promptKey)
      .then((response) => {
        if (!cancelled) {
          setPrompts((current) => ({ ...current, [mode]: response }))
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPromptErrors((current) => ({
            ...current,
            [mode]:
              error instanceof Error
                ? error.message
                : "Could not load import instructions.",
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [active, mode, projectId, prompt, promptError])

  function resetConversationState() {
    setConversations([])
    setSelectedConversationId(null)
    setConversationQuery("")
    setParsedProvider(null)
    setLocalError(null)
  }

  async function handleCopyPrompt() {
    if (!prompt?.prompt_text) {
      return
    }

    await navigator.clipboard.writeText(prompt.prompt_text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  async function handleParseFile(file: File) {
    setLocalError(null)
    setIsParsing(true)
    resetConversationState()

    try {
      const parsed: ParseExportResponse = await parseExport(projectId, file)
      setParsedProvider(parsed.provider)
      setConversations(parsed.conversations)

      if (parsed.conversations.length === 1) {
        setSelectedConversationId(parsed.conversations[0]?.id ?? null)
      }

      if (parsed.conversations.length === 0) {
        setLocalError("No conversations found in this export file.")
      }
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not parse export file."
      )
    } finally {
      setIsParsing(false)
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (file) {
      await handleParseFile(file)
    }
  }

  async function handleImportSelected() {
    if (
      !selectedConversation ||
      !effectiveProvider ||
      disabled ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    setLocalError(null)

    try {
      await onSelectConversation(
        selectedConversation.transcript_markdown,
        effectiveProvider,
        selectedConversation.id
      )
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Could not import selected conversation."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImportMemory() {
    const trimmed = memoryText.trim()

    if (!trimmed || disabled || isSubmitting) {
      setLocalError("Paste your AI memory or exported notes to continue.")
      return
    }

    setIsSubmitting(true)
    setLocalError(null)

    try {
      await onSubmitMemoryPaste(trimmed)
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Could not import pasted memory."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={mode === item.id ? "default" : "outline"}
            disabled={disabled || isSubmitting}
            onClick={() => {
              setMode(item.id)
              resetConversationState()
              setMemoryText("")
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg px-3 py-3">
        {isLoadingPrompt ? (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading export steps…
          </div>
        ) : prompt ? (
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-medium">
                {mode === "ai_memory"
                  ? "Import AI memory or notes"
                  : `How to export from ${mode}`}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {prompt.prompt_text}
              </p>
              <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-4 text-xs leading-5">
                {prompt.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => void handleCopyPrompt()}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden="true" />
                    Copy prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : promptError ? (
          <p className="text-destructive text-xs">{promptError}</p>
        ) : null}
      </div>

      {mode === "ai_memory" ? (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="export-memory-paste">Memory or notes</Label>
            <Textarea
              id="export-memory-paste"
              value={memoryText}
              onChange={(event) => setMemoryText(event.target.value)}
              placeholder="Paste exported AI memory, saved instructions, or copied chat context…"
              rows={8}
              disabled={disabled || isSubmitting}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={disabled || isSubmitting || !memoryText.trim()}
              onClick={() => void handleImportMemory()}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Importing…
                </>
              ) : (
                "Extract preview"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "border-border/70 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
              dragActive && "border-brand/50 bg-brand/5",
              disabled && "pointer-events-none opacity-60"
            )}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)

              const file = event.dataTransfer.files[0]

              if (file) {
                void handleParseFile(file)
              }
            }}
          >
            <div className="bg-background flex size-9 items-center justify-center rounded-full border shadow-sm">
              <Upload
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-sm font-medium">Drop export file here</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {mode === "chatgpt"
                ? "conversations.json or ChatGPT export ZIP"
                : "Claude conversations JSONL export"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={disabled || isParsing}
              onClick={() => inputRef.current?.click()}
            >
              {isParsing ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Parsing…
                </>
              ) : (
                <>
                  <FileUp className="size-3.5" aria-hidden="true" />
                  Upload export file
                </>
              )}
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={
                mode === "chatgpt"
                  ? ".json,.zip,application/json,application/zip"
                  : ".jsonl,.json,application/json"
              }
              disabled={disabled || isParsing}
              onChange={(event) => void handleFileChange(event)}
            />
          </div>

          {parsedProvider && parsedProvider !== mode ? (
            <p className="text-muted-foreground text-xs">
              Detected a{" "}
              <span className="text-foreground font-medium capitalize">
                {parsedProvider}
              </span>{" "}
              export — conversation list updated accordingly.
            </p>
          ) : null}

          {conversations.length > 0 ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Select a conversation</Label>
                <Badge variant="outline" className="text-[10px]">
                  {filteredConversations.length} of {conversations.length}
                </Badge>
              </div>

              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  value={conversationQuery}
                  onChange={(event) => setConversationQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="h-8 pl-8 text-xs"
                  disabled={disabled || isSubmitting}
                  aria-label="Search exported conversations"
                />
              </div>

              <ScrollArea className="max-h-44 rounded-lg border">
                <div className="grid gap-1 p-2">
                  {filteredConversations.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-3 text-xs">
                      No conversations match your search.
                    </p>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const isSelected =
                        conversation.id === selectedConversationId

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          disabled={disabled || isSubmitting}
                          onClick={() =>
                            setSelectedConversationId(conversation.id)
                          }
                          className={cn(
                            "hover:bg-muted/50 rounded-md px-3 py-2 text-left transition-colors",
                            isSelected && "bg-muted ring-border ring-1"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium">
                              {conversation.title || "Untitled conversation"}
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px]"
                            >
                              {conversation.message_count} msgs
                            </Badge>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </ScrollArea>

              {selectedConversation ? (
                <div className="grid gap-1.5">
                  <Label>Transcript preview</Label>
                  <ScrollArea className="max-h-36 rounded-lg border">
                    <pre className="text-muted-foreground p-3 text-[11px] leading-5 whitespace-pre-wrap">
                      {selectedConversation.transcript_markdown.slice(0, 1200)}
                      {selectedConversation.transcript_markdown.length > 1200
                        ? "…"
                        : ""}
                    </pre>
                  </ScrollArea>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={
                    disabled ||
                    isSubmitting ||
                    !selectedConversationId ||
                    !effectiveProvider
                  }
                  onClick={() => void handleImportSelected()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Importing…
                    </>
                  ) : (
                    "Extract preview"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {localError ? (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <p>{localError}</p>
        </div>
      ) : null}
    </div>
  )
}
