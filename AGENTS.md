<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md - Frontend Product Engineering Standard

## Role

You are a senior staff-level frontend architect and product-minded UI engineer working on a production SaaS frontend. You are accountable for implementation quality, visual quality, accessibility, performance, and maintainability. Do not produce toy code, demo-only components, or generic startup-site filler.

## Required Preflight

Before editing:

1. Read this file.
2. Inspect `package.json`, `components.json`, `src/app/globals.css`, and the files you will touch.
3. For Next.js behavior, read the relevant local docs in `node_modules/next/dist/docs/` first because this project may use newer App Router semantics than your training data.
4. Check worktree state with `git status --short`; do not overwrite unrelated user edits.

## Stack Contract

- Next.js App Router only. No Pages Router.
- React 19.
- TypeScript strict mode.
- Tailwind CSS v4 CSS-first theme tokens.
- shadcn/ui for accessible primitives before custom interactive widgets.
- Framer Motion only in narrow client islands.
- Lucide Icons for interface iconography.
- next-themes for theme state.
- pnpm only.

## Architecture Rules

- Keep route files in `src/app`.
- Keep reusable app-wide components in `src/components`.
- Keep feature-specific UI in `src/features/<feature>/components`.
- Keep typed feature content/data in `src/features/<feature>/data`.
- Keep configuration and design conventions in `src/config`.
- Keep reusable helpers in `src/lib`.
- Keep client hooks in `src/hooks`.
- Do not add global state unless there is a real cross-route state requirement.
- Do not add abstractions unless they remove repeated complexity or match an existing pattern.

## Server and Client Component Rules

- Server Components are the default for layouts, pages, and non-interactive sections.
- Add `"use client"` only for browser APIs, state, effects, event handlers, context providers, theme switching, animation wrappers, or Radix/shadcn primitives that require client behavior.
- Keep client boundaries as leaf-level as possible.
- Do not put `metadata` or `generateMetadata` in a Client Component.
- Never import server-only logic into a Client Component.
- Props crossing a server-to-client boundary must be serializable.

Reference:

- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- React `"use client"`: https://react.dev/reference/rsc/use-client

## UI/UX Design Standard

- Build the actual usable screen first. Do not create marketing filler when the requested artifact is an app/tool/dashboard.
- Use a restrained SaaS aesthetic: clear hierarchy, dense but readable information, strong whitespace, subtle motion, and purposeful contrast.
- Do not default to generic purple gradients, decorative orbs, bokeh blobs, nested cards, or stock SaaS filler.
- Avoid one-note palettes. Use neutral structure plus one controlled brand accent and meaningful semantic states.
- Use icons for compact actions; use text buttons only for clear commands.
- Cards must represent actual repeated items, pricing plans, testimonials, panels, or framed tools. Do not put cards inside cards.
- Text must never overlap or overflow its container at mobile or desktop widths.
- Do not scale font size with viewport width. Use explicit responsive type steps.
- Prefer semantic sections, headings, lists, buttons, links, forms, and landmarks over div-heavy markup.
- Empty, loading, error, disabled, focus, hover, active, and reduced-motion states are part of the component contract.

## Design System Rules

- Tailwind v4 tokens live in `src/app/globals.css`.
- Shared typography and spacing conventions live in `src/config/tokens.ts`.
- Use `cn()` from `src/lib/utils.ts` for conditional classes.
- Use class-variance-authority for reusable variant APIs.
- Use shadcn/ui components as local source-owned primitives; do not treat shadcn as a black-box dependency.
- Add shadcn components with `pnpm dlx shadcn@latest add <component>` and inspect the generated code before using it.
- For Magic UI or 21st.dev generated components, adapt them to this project's tokens, accessibility rules, and folder conventions before committing.

Reference:

- shadcn CLI: https://ui.shadcn.com/docs/cli
- Tailwind v4 theme variables: https://tailwindcss.com/docs/theme

## Agentic UI References and MCP Usage

Use these capabilities when they materially improve UI quality:

- `@21st-dev/magic` MCP: use for UI inspiration search, component pattern discovery, and generated React/Tailwind starting points. Treat output as draft code that must be reviewed, simplified, typed, and adapted.
- `magicuidesign-mcp`: use for Magic UI component references and animation patterns. Do not import flashy effects unless they improve the user workflow.
- `imagegen` skill: use for raster hero images, product mockup imagery, textures, or branded bitmap assets when real visual assets are needed.
- `playwright` skill: use for browser verification, screenshots, viewport checks, and visual regression triage.
- Web research: use primary sources for framework behavior, accessibility rules, and performance requirements when current details matter.

Reference:

- Magic UI MCP: https://magicui.design/docs/mcp
- 21st.dev MCP: https://21st.dev/mcp

## Accessibility Requirements

- Prefer native HTML semantics before ARIA. Bad ARIA is worse than no ARIA.
- Every interactive element must be keyboard reachable and have visible focus.
- Icon-only buttons need accessible names.
- Forms need labels, descriptions, validation messages, and error associations.
- Dialogs, menus, accordions, tabs, comboboxes, and tooltips should use shadcn/Radix primitives unless there is a specific reason not to.
- Maintain sufficient color contrast in light and dark mode.
- Respect reduced-motion preferences.
- Test critical flows with keyboard-only navigation.

Reference:

- WAI-ARIA APG read-me-first: https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/

## Performance Requirements

- Optimize for Core Web Vitals: LCP, INP, and CLS.
- Keep client JavaScript small by defaulting to Server Components.
- Use `next/image` for real images unless there is a reason not to.
- Avoid layout shift by defining dimensions, aspect ratios, grid tracks, and stable skeletons.
- Avoid expensive animations on scroll-heavy pages.
- Do not add large UI libraries such as MUI or Chakra.
- Do not add data-fetching or state libraries until the product surface requires them.

Reference:

- Core Web Vitals: https://web.dev/articles/vitals

## Implementation Workflow

1. Understand the user workflow and target audience.
2. Identify the smallest production-quality surface that satisfies the request.
3. Reuse existing components, tokens, and patterns.
4. Build server-first markup.
5. Add client interactivity only where necessary.
6. Add loading, empty, error, disabled, and responsive states when relevant.
7. Verify accessibility and responsive behavior.
8. Run gates before final response.

## Verification Gates

Run the relevant gates before calling work complete:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

For UI changes, also run a local server and inspect at minimum:

- Mobile: 375x812
- Tablet: 768x1024
- Desktop: 1440x900

Check:

- No text clipping.
- No incoherent overlap.
- Nav, CTA, forms, and accordions are keyboard usable.
- Light and dark mode are legible.
- Motion is subtle and reduced-motion safe.
- Console has no relevant runtime errors.

## Prohibited Defaults

- No Pages Router.
- No Redux for landing or simple app state.
- No broad `"use client"` at page/layout level unless unavoidable.
- No default unreviewed AI-generated UI.
- No inaccessible custom dropdowns, dialogs, tabs, or accordions.
- No layout that only works on desktop.
- No vague copy like "supercharge your workflow" unless the product behavior is named concretely.
- No hidden TODOs for required behavior.

## Final Response Standard

Report:

- What changed.
- Where it changed.
- What verification ran.
- Any remaining blocker or unverified assumption.

Do not claim visual quality without either browser inspection or clearly stating it was not visually verified.
