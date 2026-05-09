# Visibl Frontend

Production-grade SaaS landing page foundation for Visibl, built with the Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Lucide Icons, and next-themes.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm format:check
pnpm check
```

## Setup Commands Used

```bash
pnpm create next-app@latest visibl-frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
pnpm add framer-motion lucide-react next-themes class-variance-authority clsx tailwind-merge sonner zod react-hook-form @hookform/resolvers
pnpm add -D prettier prettier-plugin-tailwindcss husky lint-staged shadcn
pnpm dlx shadcn@latest init --template next --preset nova --yes --no-monorepo --pointer
pnpm dlx shadcn@latest add accordion badge button card separator skeleton sonner --yes
```

## Architecture

```txt
src/
  app/                         App Router entrypoints, metadata, favicon, OG image
  components/
    layout/                    Container and section primitives
    marketing/                 Landing-specific shared primitives
    motion/                    Narrow Framer Motion client islands
    providers/                 Client providers kept below the root HTML shell
    ui/                        shadcn/ui primitives
  config/                      Site config, env validation, spacing and typography tokens
  features/
    landing/
      components/              Feature-owned landing sections
      data/                    Typed content contracts for sections
  hooks/                       Reusable client hooks
  lib/                         cn, metadata helpers, motion presets
  styles/                      Styling conventions and notes
```

## Decisions

- App Router only: `src/app` owns routing, metadata, loading UI, favicon, and Open Graph generation.
- Server Components by default: landing sections are server-rendered; client boundaries are limited to theme switching, shadcn interactive primitives, and motion wrappers.
- Feature-driven folders: landing sections live under `features/landing` so future auth, dashboard, billing, and onboarding features can be added without flattening the app.
- CSS-first Tailwind v4: design tokens live in `src/app/globals.css`; reusable spacing and typography conventions live in `src/config/tokens.ts`.
- shadcn/ui primitives: accessible UI components are local, editable, and dependency-light compared with large component libraries.
- Typed environment config: public environment variables are parsed with Zod in `src/config/env.ts`; `.env.example` documents required values.
- SEO-ready metadata: `constructMetadata` centralizes title, description, canonical URL, robots, OpenGraph, and Twitter card defaults.
- Vercel-ready: Next config stays minimal, static metadata routes are included, and the app builds through `next build`.

## Environment

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_APP_NAME=Visibl
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=founders@visibl.me
```

## Quality Gates

Run before pushing:

```bash
pnpm check
pnpm build
```
