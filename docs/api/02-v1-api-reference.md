# V1 API Reference

Base URL: `{API_BASE_URL}` (e.g. `http://localhost:8000`)

All v1 routes: `{API_BASE_URL}/api/v1`

OpenAPI (live): `{API_BASE_URL}/api/v1/openapi.json`

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
  "id": "uuid",
  "owner_user_id": "uuid",
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
      "id": "uuid",
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

`404` if not found or not owner.

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
  "id": "uuid",
  "project_id": "uuid",
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
  "company_map": {
    /* CompanyMapRead */
  },
  "artifact_hub": {
    /* ArtifactHubRead */
  },
  "user_display_name": "founder_username"
}
```

- `messages`: up to 50 most recent, ascending by `sequence`
- `memory_pins`: active only (`is_archived: false`), conversation-scoped
- `company_map`: canonical project field read model plus pending/reviewed candidates
- `artifact_hub`: required artifact readiness, blocker, source-strength, stale, and version state
- Use on workspace load and after navigation

---

## Company Map (`/projects/{project_id}/company-map`)

All routes require auth and enforce project ownership.

| Method | Path                                                             | Description                              |
| ------ | ---------------------------------------------------------------- | ---------------------------------------- |
| GET    | `/projects/{project_id}/company-map`                             | Current grouped Company Map fields       |
| GET    | `/projects/{project_id}/company-map/candidates`                  | Pending and reviewed field candidates    |
| POST   | `/projects/{project_id}/company-map/candidates/{id}/accept`      | Accept a candidate into a field revision |
| POST   | `/projects/{project_id}/company-map/candidates/{id}/edit-accept` | Accept edited candidate value            |
| POST   | `/projects/{project_id}/company-map/candidates/{id}/reject`      | Reject candidate                         |
| POST   | `/projects/{project_id}/company-map/candidates/{id}/archive`     | Archive candidate                        |
| POST   | `/projects/{project_id}/company-map/candidates/{id}/clarify`     | Mark candidate as needing clarification  |

Candidate accept and edit-accept support stale replacement guards:

```json
{
  "expected_revision_id": "uuid or null",
  "allow_replace": true
}
```

Artifact versions read from Company Map field revisions. Artifact routes must not silently rewrite Company Map fields or memory pins.

---

## Artifacts (`/projects/{project_id}/artifacts`)

All routes require auth and enforce project ownership.

| Method | Path                                                                   | Description                                            |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/projects/{project_id}/artifacts`                                     | Artifact Hub with durable artifact/readiness state     |
| GET    | `/projects/{project_id}/artifacts/{artifact_id}`                       | Artifact detail, current version state if present      |
| POST   | `/projects/{project_id}/artifacts/{artifact_id}/versions`              | Create an internal source-backed deterministic version |
| GET    | `/projects/{project_id}/artifacts/{artifact_id}/versions`              | List artifact versions, newest first                   |
| GET    | `/projects/{project_id}/artifacts/{artifact_id}/versions/{version_id}` | Read one immutable artifact version                    |

`GET /artifacts` lazily ensures one durable artifact row per required registry artifact and persists a readiness snapshot when the current dependency hash changes.

`POST /versions` is synchronous and deterministic in this foundation version. It creates:

- an immutable source snapshot from the current required Company Map fields;
- an immutable artifact version with section IDs, field labels, support labels, source refs, and caveats;
- a transactional `current_version_id` update only after the version row exists.

Version creation is currently for internal drafts only. It does not create docs, files, slide files, hosted pages, or public links.

Example artifact detail fields:

```json
{
  "id": "company_map",
  "readiness": "Draftable",
  "version_state": {
    "label": "Version 1 current",
    "detail": "This internal version matches the current source dependency hash."
  },
  "current_version": {
    "id": "uuid",
    "version_number": 1,
    "source_snapshot_id": "uuid",
    "is_stale": false,
    "content": {
      "title": "Company Map internal draft",
      "source_scope": "project",
      "sections": [
        {
          "id": "field-company_name",
          "field_key": "company_name",
          "label": "Company name",
          "value": "Acme Startup",
          "support_label": "Share-safe",
          "source_refs": [],
          "caveats": []
        }
      ],
      "caveats": []
    },
    "share_safety_status": "needs_review"
  },
  "can_create_version": true,
  "create_version_disabled_reason": null
}
```

Stale model:

- version `dependency_hash` is compared to the current required Company Map field/source dependency hash;
- stale versions remain internally readable;
- stale versions are not represented as externally share-safe.

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

FastAPI default:

```json
{ "detail": "Human-readable message" }
```

Validation errors may return `detail` as an array of field errors.

---

## CORS

Backend allows configured origins with credentials. Frontend must:

```javascript
fetch(url, { credentials: "include" })
```

---

## Not available in v1 (do not build against)

| Feature                        | Status                 |
| ------------------------------ | ---------------------- |
| PATCH project                  | Not implemented        |
| DELETE project / conversation  | Not implemented        |
| POST pin / PATCH checklist     | Tools only (assistant) |
| List messages (standalone)     | Use workspace          |
| Upload files                   | Not implemented        |
| Git graph / commits            | Placeholder UI         |
| Document and slide file export | Not implemented        |
| Hosted public pages            | Future                 |
| WebSocket chat                 | SSE only               |
