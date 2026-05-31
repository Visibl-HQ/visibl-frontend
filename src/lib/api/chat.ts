import { apiFetch, getApiV1Url } from "@/lib/api/client"
import type { ChatDonePayload } from "@/lib/api/types"

export type ChatStreamHandlers = {
  onTextDelta: (chunk: string) => void
  onToolCall?: (tool: string, args: Record<string, unknown>) => void
  onToolResult?: (tool: string, result: unknown) => void
  onDone: (payload: ChatDonePayload) => void
  onError: (error: Error) => void
}

function normalizeSseBuffer(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function parseSseEvent(part: string): { event: string; data: string } | null {
  if (!part.trim()) {
    return null
  }

  let event = "message"
  let data = ""

  for (const rawLine of part.split("\n")) {
    const line = rawLine.trimEnd()

    if (line.startsWith("event: ")) {
      event = line.slice(7).trim()
    }

    if (line.startsWith("data: ")) {
      const nextLine = line.slice(6)
      data = data ? `${data}\n${nextLine}` : nextLine
    }
  }

  if (!data) {
    return null
  }

  return { event, data }
}

function dispatchSseEvent(
  parsedEvent: { event: string; data: string },
  handlers: ChatStreamHandlers
): void {
  const payload = JSON.parse(parsedEvent.data) as Record<string, unknown>

  if (parsedEvent.event === "text_delta") {
    handlers.onTextDelta(String(payload.content ?? ""))
  }

  if (parsedEvent.event === "tool_call" && handlers.onToolCall) {
    handlers.onToolCall(
      String(payload.tool ?? ""),
      (payload.args as Record<string, unknown>) ?? {}
    )
  }

  if (parsedEvent.event === "tool_result" && handlers.onToolResult) {
    handlers.onToolResult(String(payload.tool ?? ""), payload.result)
  }

  if (parsedEvent.event === "done") {
    handlers.onDone(payload as unknown as ChatDonePayload)
  }
}

function consumeSseBuffer(
  buffer: string,
  handlers: ChatStreamHandlers,
  flush = false
): string {
  const normalized = normalizeSseBuffer(buffer)
  const parts = normalized.split("\n\n")

  if (!flush) {
    const remainder = parts.pop() ?? ""

    for (const part of parts) {
      const parsedEvent = parseSseEvent(part)

      if (parsedEvent) {
        dispatchSseEvent(parsedEvent, handlers)
      }
    }

    return remainder
  }

  for (const part of parts) {
    const parsedEvent = parseSseEvent(part)

    if (parsedEvent) {
      dispatchSseEvent(parsedEvent, handlers)
    }
  }

  return ""
}

export async function sendChatMessage(
  projectId: string,
  conversationId: string,
  content: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const requestInit: RequestInit = {
    method: "POST",
    body: JSON.stringify({ content }),
  }

  if (signal) {
    requestInit.signal = signal
  }

  const response = await apiFetch(
    `/projects/${projectId}/conversations/${conversationId}/messages`,
    requestInit
  )

  if (!response.ok) {
    handlers.onError(new Error(`Chat failed with status ${response.status}`))
    return
  }

  const reader = response.body?.getReader()

  if (!reader) {
    handlers.onError(new Error("Chat stream is unavailable"))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        buffer += decoder.decode()
        consumeSseBuffer(buffer, handlers, true)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      buffer = consumeSseBuffer(buffer, handlers)
    }
  } catch (error) {
    if (signal?.aborted) {
      return
    }

    handlers.onError(
      error instanceof Error ? error : new Error("Chat stream failed")
    )
  }
}

export function getChatMessagesUrl(
  projectId: string,
  conversationId: string
): string {
  return getApiV1Url(
    `/projects/${projectId}/conversations/${conversationId}/messages`
  )
}
