import { env } from "@/config/env"

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  supportEmail: env.NEXT_PUBLIC_SUPPORT_EMAIL,
  description:
    "Visibl turns messy startup context into an evidence-linked company map, gated artifacts, versioned decisions, and hosted pages that learn from every share.",
  links: {
    x: "https://x.com",
    github: "https://github.com",
    docs: "/docs",
  },
  navItems: [
    { label: "Product", href: "#product" },
    { label: "Workflow", href: "#workflow" },
    { label: "Proof", href: "#proof" },
    { label: "Philosophy", href: "#philosophy" },
  ],
} as const
