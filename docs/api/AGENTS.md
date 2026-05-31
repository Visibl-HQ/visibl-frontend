# AGENTS.md — Frontend integration

You are building the Visibl frontend against **visibl-backend** v1.

## Read first

1. `context-for-frontend/00-overview.md`
2. `context-for-frontend/01-auth-and-session.md`
3. `context-for-frontend/02-v1-api-reference.md`
4. `context-for-frontend/03-screen-flows.md`
5. `context-for-frontend/04-chat-sse.md`

## Rules

- **No invented APIs.** If an endpoint is not in `02-v1-api-reference.md`, ask backend — do not mock permanent shapes.
- **Cookie auth only** on protected routes (`credentials: 'include'`).
- **API base URL** from env (e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`).
- **Google sign-in:** redirect browser to `{API_BASE_URL}/api/v1/auth/google/login`.
- **After OAuth:** backend redirects to `FRONTEND_REDIRECT_AFTER_LOGIN` with cookies set; frontend route should call `GET /api/v1/auth/me` then route to dashboard.
- **401 handling:** try `POST /api/v1/auth/refresh` once, then redirect to login.
- **Do not** call backend for: creating pins, updating checklist sections — assistant tools only in v1.
- **Git graph** left rail: placeholder UI only in v1 (no API).
- Match finalized design; use workspace payload for sidebar truth.

## Suggested stack assumptions

- Next.js App Router or equivalent
- Server/client fetch with credentials
- `EventSource` or `fetch` + readable stream for SSE

## When backend changes

Re-check `02-v1-api-reference.md` and OpenAPI. Backend uses Alembic; contract changes should be announced in this folder.
