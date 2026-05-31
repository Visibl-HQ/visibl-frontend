# Frontend Integration Overview

Instructions for agents and developers building the Visibl **frontend** against `visibl-backend`.

Design is finalized; backend v1 APIs are implemented. Wire the UI to these contracts — do not invent endpoints or auth flows.

## Source order

1. User request in the current conversation
2. This `context-for-frontend/` folder
3. Backend OpenAPI: `{API_BASE_URL}/api/v1/openapi.json` (when server is running)
4. `lifecycle/` and `context-for-backend/` for product nuance (backend behavior wins on conflicts)

## What v1 is

A founder can:

1. Sign in with Google
2. See a projects dashboard (Vercel-like list)
3. Open a project workspace (3-column layout in design)
4. Start or resume a **conversation** per project
5. Chat (streaming) with an AI that updates **memory pins** and a **problem/customer** doc checklist
6. See sidebar state refresh from workspace + chat `done` events

**Not in v1 API:** git graph commits, multiple doc types, hosted public pages, pin archival, manual pin/doc edit APIs, file uploads.

## Environment (local)

| Variable | Typical value |
|----------|----------------|
| Frontend | `http://localhost:3000` (or `5173`) |
| API | `http://localhost:8000` |
| API prefix | `/api/v1` |

Backend must be started from `backend/`:

```powershell
cd backend
uv run uvicorn app.main:app --host localhost --port 8000 --reload
```

Use **`localhost`** in browser and env — not `127.0.0.1` — so Google OAuth redirect URIs match.

## Docs in this folder

| File | Purpose |
|------|---------|
| [01-auth-and-session.md](./01-auth-and-session.md) | Google OAuth, cookies, session refresh |
| [02-v1-api-reference.md](./02-v1-api-reference.md) | Every endpoint, schemas, errors |
| [03-screen-flows.md](./03-screen-flows.md) | Which API to call per screen |
| [04-chat-sse.md](./04-chat-sse.md) | Streaming chat protocol |
| [AGENTS.md](./AGENTS.md) | Rules for frontend coding agents |

## Non-negotiables for frontend

- All authenticated calls: `credentials: 'include'` (cookies)
- Do not store access tokens in `localStorage` — httpOnly cookies only
- Google login: **full navigation** to API login URL, not a popup with a different redirect
- Chat: consume SSE; on `done`, merge pins + doc into UI state
- Project isolation: only show projects/conversations returned by API (404 = no access)
- Poll or re-fetch workspace only when needed; prefer `done` payload after each message
