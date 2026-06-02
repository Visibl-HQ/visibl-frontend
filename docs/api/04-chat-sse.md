# Chat SSE Protocol

## Endpoint

```http
POST /api/v1/projects/{project_id}/conversations/{conversation_id}/messages
Content-Type: application/json
Cookie: access_token=...; refresh_token=...
```

```json
{ "content": "User message text" }
```

## Response

- **Status:** 200
- **Content-Type:** `text/event-stream`
- **Headers:** `Cache-Control: no-cache`, `Connection: keep-alive`

## Event format

Standard SSE:

```text
event: {event_name}
data: {json}

```

Blank line between events.

### Event types

| Event         | When                       | `data` shape                                       |
| ------------- | -------------------------- | -------------------------------------------------- |
| `text_delta`  | Assistant text streaming   | `{ "content": "partial text" }`                    |
| `tool_call`   | Assistant invoked a tool   | `{ "tool": "create_memory_pin", "args": { ... } }` |
| `tool_result` | Tool finished              | `{ "tool": "call_id or name", "result": "..." }`   |
| `done`        | Stream complete, persisted | See below                                          |

### `done` payload

```json
{
  "assistant_message_id": "message-public-id",
  "user_message_public_id": "message-public-id",
  "problem_customer_doc": {
    "id": "uuid",
    "conversation_id": "uuid",
    "checklist": { "sections": { ... } },
    "completion_percentage": 25.0,
    "created_at": "...",
    "updated_at": "..."
  },
  "memory_pins": [
    {
      "public_id": "opaque-token",
      "conversation_public_id": "opaque-token",
      "pin_type": "metric",
      "payload": { "value": "10", "label": "Stores interviewed" },
      "is_archived": false,
      "source_message_public_id": "message-public-id",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**Frontend should:**

1. Replace sidebar doc state with `problem_customer_doc`
2. Replace pins list with `memory_pins` (full list for conversation)
3. Finalize assistant message in thread (concatenate prior `text_delta`s)
4. Ensure user message is shown (optimistic UI OK; confirm `user_message_public_id` and `assistant_message_id` here)

## Fetch + ReadableStream example

`EventSource` only supports GET — use **fetch** for POST + SSE:

```typescript
async function sendChatMessage(
  projectId: string,
  conversationId: string,
  content: string,
  handlers: {
    onTextDelta: (chunk: string) => void
    onToolCall?: (tool: string, args: Record<string, unknown>) => void
    onDone: (payload: DonePayload) => void
    onError: (err: Error) => void
  }
) {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  )

  if (!res.ok) {
    handlers.onError(new Error(`Chat failed: ${res.status}`))
    return
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""

    for (const part of parts) {
      if (!part.trim()) continue
      let event = "message"
      let data = ""
      for (const line of part.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7)
        if (line.startsWith("data: ")) data = line.slice(6)
      }
      if (!data) continue
      const parsed = JSON.parse(data)
      if (event === "text_delta") handlers.onTextDelta(parsed.content)
      if (event === "tool_call" && handlers.onToolCall)
        handlers.onToolCall(parsed.tool, parsed.args)
      if (event === "done") handlers.onDone(parsed)
    }
  }
}
```

## UX notes

- Show typing indicator after POST until first `text_delta` or `done`
- `tool_call` for `update_problem_customer_section` → optional subtle “Updating problem & customer…”
- `tool_call` for `create_memory_pin` → optional “Pinned a note”
- On network error mid-stream: show retry; user message may already be persisted — refetch workspace on recovery
- Empty content → `400` before stream starts

## Errors (non-SSE)

| Status | Cause                                       |
| ------ | ------------------------------------------- |
| 400    | Empty message                               |
| 401    | Not authenticated                           |
| 404    | Project/conversation not found or not owned |
