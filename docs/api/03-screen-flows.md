# Screen Flows → API Mapping

Maps finalized UI to v1 endpoints. Route names are suggestions; adjust to your router.

---

## 1. Marketing / login

**UI:** “Sign in with Google”

**Action:**

```text
window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`
```

No client-side Google SDK required for v1.

---

## 2. Auth callback (`/auth/callback`)

**UI:** Loading spinner

**Actions:**

1. `GET /api/v1/auth/me` (credentials included)
2. Success → `router.replace('/projects')`
3. Failure → error state + retry login link

---

## 3. Projects dashboard (Vercel-like)

**UI:** Grid/list of project cards, “New project”, user menu (logout)

**On load:**

```http
GET /api/v1/auth/me
GET /api/v1/projects/?limit=20
```

**New project modal:**

```http
POST /api/v1/projects/
{ "name": "..." }
```

Then navigate to workspace with a new conversation (see below).

**Card data:** `ProjectSummaryRead` — show `name`, `current_stage`, `current_goal`, `conversation_count`, `updated_at`

**Pagination:** “Load more” when `next_cursor` present

**Logout:**

```http
POST /api/v1/auth/logout
```

---

## 4. Project workspace (main 3-column view)

**Route suggestion:** `/projects/[projectId]/conversations/[conversationId]`

### Layout (from product)

| Column       | v1 behavior                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| Left         | Project name, account label, **git graph placeholder** (empty state copy only) |
| Center       | Chat thread + composer                                                         |
| Right top    | Memory pins (this conversation)                                                |
| Right bottom | **Problem & customer** doc card + `%` bar                                      |

### On enter

1. `GET /projects/{projectId}` — optional if workspace includes project
2. `GET /projects/{projectId}/conversations/{conversationId}/workspace` — **primary hydrate**

Populate:

- Chat from `messages`
- Pins from `memory_pins`
- Doc card from `problem_customer_doc`
- Header from `project.name`, `user_display_name`

### New conversation (from dashboard or “+” in project)

```http
POST /projects/{projectId}/conversations/
{ "title": null }
```

Navigate to new `conversation.id`, then load workspace.

### Conversation switcher (if design has multiple)

```http
GET /projects/{projectId}/conversations/?limit=20
```

**Important:** Switching conversation changes pins and doc — they are **not** project-global.

---

## 5. Chat composer

**On send:**

```http
POST /projects/{projectId}/conversations/{conversationId}/messages
{ "content": "..." }
```

Accept `text/event-stream`:

- Append `text_delta` to assistant bubble
- Optionally show tool activity from `tool_call` / `tool_result`
- On `done`: merge `memory_pins` and `problem_customer_doc` into sidebar state; add user + assistant messages to thread (or refetch workspace)

Disable composer while stream in flight.

See [04-chat-sse.md](./04-chat-sse.md).

---

## 6. Global auth guard

Protected layouts (`/projects`, `/projects/...`):

1. `GET /auth/me` on layout mount
2. 401 → try refresh → still 401 → redirect to login

---

## Suggested client state

```typescript
type WorkspaceState = {
  project: ProjectRead
  conversation: ConversationRead
  messages: MessageRead[]
  memoryPins: MemoryPinRead[]
  problemCustomerDoc: ProblemCustomerDocRead
  userDisplayName: string
}
```

Update from:

- Initial: workspace GET
- After chat: `done` event payload (partial update) or workspace GET

---

## URL state recommendations

| Param            | Purpose              |
| ---------------- | -------------------- |
| `projectId`      | Current project      |
| `conversationId` | Current conversation |

Deep-link: `/projects/{id}/conversations/{id}` after OAuth callback if you store `returnTo` in sessionStorage before Google redirect.

---

## Empty states

| Surface          | Copy direction                                     |
| ---------------- | -------------------------------------------------- |
| No projects      | CTA create first project                           |
| No conversations | Auto-create on first enter or CTA                  |
| No pins          | “Key facts will appear as you talk”                |
| Doc 0%           | “Problem & customer — unlocks as you share detail” |
| Git rail         | “Version history coming soon”                      |
