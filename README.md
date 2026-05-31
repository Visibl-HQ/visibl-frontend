# Visibl Frontend

Founder workspace UI for Visibl — projects, multi-thread chat, memory pins, problem/customer doc, and idea history (checkpoints, branches, graph).

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm check    # typecheck + lint + format:check
```

## Repo layout

```txt
src/
  app/              App Router routes (landing, auth, projects, workspace)
  components/       Shared layout, marketing, and shadcn/ui primitives
  config/           Site config, env validation, design tokens, asset paths
  features/         Feature modules (landing, workspace, idea-history, auth, projects)
  hooks/            Reusable client hooks
  lib/              API client, utilities, metadata helpers
docs/
  api/              Backend v1 contract (auth, REST, SSE, screen flows)
  product-brief.md  Product positioning for landing/marketing
public/
  assets/           Brand and marketing images (see public/assets/README.md)
```

Implementation standards live in [AGENTS.md](./AGENTS.md). Backend integration docs live in [docs/api/](./docs/api/).

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_APP_NAME=Visibl
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPPORT_EMAIL=founders@visibl.me
```

## Stack

Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion (narrow client islands), Lucide icons, next-themes.

## Before push

```bash
pnpm check
pnpm build
```
