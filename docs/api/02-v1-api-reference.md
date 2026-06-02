# V1 API Reference

Base URL: `{API_BASE_URL}` (e.g. `http://localhost:8000`)

All v1 routes: `{API_BASE_URL}/api/v1`

OpenAPI (live): `{API_BASE_URL}/api/v1/openapi.json`

**Identifiers:** Path segments named `{project_id}`, `{conversation_id}`, etc. carry opaque **`public_id`** strings (~22 URL-safe chars), not UUIDs. JSON resources expose `public_id` / `*_public_id` fields. See backend `context-for-frontend/07-frontend-migration-public-ids-and-errors.md`.

---

## Health

| Method | Path        | Auth | Notes                                        |
| ------ | ----------- | ---- | -------------------------------------------- |
| GET    | `/`         | No   | `{ "message": "Welcome to the visibl API" }` |
| GET    | `/db_check` | No   | Dev health                                   |

---

## Auth (`/auth`)

| Method | Path                    | Auth           | Description                          |
| ------ | ----------------------- | -------------- | ------------------------------------ |
| GET    | `/auth/google/login`    | No             | 302 → Google OAuth                   |
| GET    | `/auth/google/callback` | No             | Google → sets cookies → 302 frontend |
| GET    | `/auth/me`              | Yes            | Current user profile                 |
| POST   | `/auth/refresh`         | Refresh cookie | Rotate session                       |
| POST   | `/auth/logout`          | Optional       | Revoke + clear cookies               |

See [01-auth-and-session.md](./01-auth-and-session.md).

---

## Projects (`/projects`)

All require auth.

### Create project

```http
POST /projects/
Content-Type: application/json
```

Body:

```json
{
  "name": "Acme Startup",
  "current_goal": "Validate PMF",
  "current_stage": "idea",
  "target_outcome": "YC application",
  "deadline_at": "2026-08-01T00:00:00Z"
}
```

Only `name` is required. Metadata fields are **display-only** in v1 (no separate patch endpoint yet).

Response `201` — `ProjectRead`:

```json
{
  "public_id": "opaque-token",
  "name": "Acme Startup",
  "current_goal": "...",
  "current_stage": "...",
  "target_outcome": "...",
  "deadline_at": null,
  "created_at": "...",
  "updated_at": "..."
}
```

### List projects (cursor pagination)

```http
GET /projects/?limit=20&cursor={optional}
```

Response:

```json
{
  "items": [
    {
      "public_id": "opaque-token",
      "name": "Acme Startup",
      "current_stage": "idea",
      "current_goal": "...",
      "created_at": "...",
      "updated_at": "...",
      "conversation_count": 3
    }
  ],
  "next_cursor": "base64string or null"
}
```

- Default `limit`: 20, max 100
- Pass `next_cursor` as `cursor` query param for next page
- Sort: newest `created_at` first

### Get project

```http
GET /projects/{project_id}
```

`404` if not found. Cross-user access returns **403** `FORBIDDEN` (not 404).

---

## Conversations (`/projects/{project_id}/conversations`)

Many conversations per project. Pins and problem/customer doc are **per conversation**.

### Create conversation

```http
POST /projects/{project_id}/conversations/
```

Body:

```json
{ "title": "First intake" }
```

`title` optional. Creates empty `problem_customer_doc` automatically.

Response `201` — `ConversationRead`:

```json
{
  "public_id": "opaque-token",
  "project_public_id": "opaque-token",
  "title": "First intake",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

`status`: `"active"` | `"archived"` (archive API not exposed in v1 UI yet)

### List conversations

```http
GET /projects/{project_id}/conversations/?limit=20&cursor=
```

Response: `CursorPage[ConversationRead]`, sorted by `updated_at` desc.

### Get conversation

```http
GET /projects/{project_id}/conversations/{conversation_id}
```

---

## Workspace (aggregate read model)

Single call to hydrate the 3-column workspace.

```http
GET /projects/{project_id}/conversations/{conversation_id}/workspace
```

Response `WorkspaceRead`:

```json
{
  "project": {
    /* ProjectRead */
  },
  "conversation": {
    /* ConversationRead */
  },
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "...",
      "sequence": 1,
      "created_at": "..."
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "...",
      "sequence": 2,
      "created_at": "..."
    }
  ],
  "memory_pins": [
    /* MemoryPinRead[] — this conversation only */
  ],
  "problem_customer_doc": {
    /* ProblemCustomerDocRead */
  },
  "user_display_name": "founder_username"
}
```

- `messages`: up to 50 most recent, ascending by `sequence`
- `memory_pins`: active only (`is_archived: false`), conversation-scoped
- Use on workspace load and after navigation

---

## Chat (streaming)

```http
POST /projects/{project_id}/conversations/{conversation_id}/messages
Content-Type: application/json
```

Body:

```json
{ "content": "We help SMB retailers reduce stockouts." }
```

Response: **`text/event-stream`** (SSE). See [04-chat-sse.md](./04-chat-sse.md).

There is **no** GET messages-only endpoint in v1 — use workspace.

---

## Data shapes (sidebar)

### Memory pin

```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "pin_type": "metric",
  "payload": { "value": "40%", "label": "Margin" },
  "is_archived": false,
  "source_message_id": "uuid or null",
  "created_at": "...",
  "updated_at": "..."
}
```

`pin_type`:

| Type     | `payload`                              |
| -------- | -------------------------------------- |
| `metric` | `{ "value": string, "label": string }` |
| `note`   | `{ "content": string }`                |

Pins are created by the **assistant** via tools during chat — no `POST /pins` in v1.

### Problem / customer doc (v1 only doc type)

```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "checklist": {
    "sections": {
      "target_customer": { "done": false, "summary": "" },
      "customer_problem": { "done": true, "summary": "B2B retailers..." },
      "problem_severity": { "done": false, "summary": "" },
      "current_workaround": { "done": false, "summary": "" },
      "why_now": { "done": false, "summary": "" },
      "customer_access": { "done": false, "summary": "" },
      "willingness_to_pay": { "done": false, "summary": "" },
      "early_validation": { "done": false, "summary": "" }
    }
  },
  "completion_percentage": 12.5,
  "created_at": "...",
  "updated_at": "..."
}
```

Section keys (enum):

- `target_customer`
- `customer_problem`
- `problem_severity`
- `current_workaround`
- `why_now`
- `customer_access`
- `willingness_to_pay`
- `early_validation`

**UI:** One card “Problem & customer” with progress bar = `completion_percentage`. Per-section done/summary can drive micro-UI (checkmarks, tooltips). Updates come from chat tools + `done` SSE event — not user edit in v1.

---

## Pagination helper

```typescript
type CursorPage<T> = { items: T[]; next_cursor: string | null }
```

Loop while `next_cursor` is non-null.

---

## Standard error body

All API errors normalize to:

```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Human-readable message",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Frontend: `ApiError` in `src/lib/api/client.ts` (`code`, `requestId`, `message`). Legacy FastAPI `{ "detail": "..." }` may still appear during rollout; the client falls back to `detail` when `error` is absent.

Validation errors may still return `detail` as an array of field errors on some routes.

---

## CORS

Backend allows configured origins with credentials. Frontend must:

```javascript
fetch(url, { credentials: "include" })
```

---

## Ingestion (file & context import)

Base: `/api/v1/projects/{projectPublicId}/ingestion` — preview-then-apply flow (poll job, review preview, apply).

Path and body identifiers use opaque **`public_id` strings** (URL-safe tokens), not UUIDs.

### Error shape

```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found",
    "request_id": "..."
  }
}
```

Frontend maps `error.code` via `src/features/ingestion/lib/ingestion-errors.ts`. S3 presigned PUT failures are handled separately (`S3UploadError`, step `s3_put`).

| Code                     | HTTP | User-facing                  |
| ------------------------ | ---- | ---------------------------- |
| `CONVERSATION_NOT_FOUND` | 404  | Conversation stale / missing |
| `FORBIDDEN`              | 403  | Not project owner            |
| `UPLOAD_OBJECT_MISSING`  | 404  | S3 object missing on confirm |
| `UPLOAD_TOO_LARGE`       | 400  | Over 25MB                    |
| `UNSUPPORTED_FILE_TYPE`  | 400  | MIME/extension rejected      |
| `JOB_ALREADY_APPLIED`    | 409  | Apply called twice           |
| `JOB_NOT_FOUND`          | 404  | Invalid job id               |

| Method | Path                         | Purpose                                                   |
| ------ | ---------------------------- | --------------------------------------------------------- |
| POST   | `/upload-url`                | Presigned S3 URL for file upload                          |
| POST   | `/source-items`              | Confirm upload or submit paste/export text → `{ job_id }` |
| GET    | `/jobs/{jobPublicId}`        | Poll extraction; includes `preview` when succeeded        |
| POST   | `/jobs/{jobPublicId}/apply`  | Apply preview to pins + problem/customer doc              |
| POST   | `/parse-export`              | Parse ChatGPT/Claude export file → conversation picker    |
| GET    | `/import-prompts/{provider}` | Wizard copy (`chatgpt`, `claude`, `generic`)              |

Frontend: `src/lib/api/ingestion.ts`, `src/features/ingestion/`. Backend contract: `visibl-backend/context-for-frontend/06-ingestion-api.md`.

---

## Not available in v1 (do not build against)

| Feature                          | Status                 |
| -------------------------------- | ---------------------- |
| PATCH project                    | Not implemented        |
| DELETE project / conversation    | Not implemented        |
| POST pin / PATCH checklist       | Tools only (assistant) |
| List messages (standalone)       | Use workspace          |
| Git graph / commits              | Idea history API       |
| Other doc types (GTM, TAM, deck) | Future                 |
| Hosted public pages              | Future                 |
| WebSocket chat                   | SSE only               |
