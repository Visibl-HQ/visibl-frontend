"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, FileStack, MessageSquare } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  artifactsPath,
  companyMapPath,
  conversationPath,
  resolveProjectWorkspaceSection,
  type ProjectWorkspaceSection,
} from "@/features/workspace/lib/workspace-routing"

type ProjectWorkspaceNavProps = {
  username: string
  projectSlug: string
  activeConversationId: string
}

const NAV_ITEMS: Array<{
  section: ProjectWorkspaceSection
  label: string
  icon: LucideIcon
}> = [
  { section: "chat", label: "Chat", icon: MessageSquare },
  { section: "company-map", label: "Company Map", icon: Building2 },
  { section: "artifacts", label: "Artifacts", icon: FileStack },
]

function getHref(
  username: string,
  projectSlug: string,
  section: ProjectWorkspaceSection,
  activeConversationId: string
): string {
  if (section === "company-map") {
    return companyMapPath(username, projectSlug)
  }

  if (section === "artifacts") {
    return artifactsPath(username, projectSlug)
  }

  return conversationPath(username, projectSlug, activeConversationId)
}

export function ProjectWorkspaceNav({
  username,
  projectSlug,
  activeConversationId,
}: ProjectWorkspaceNavProps) {
  const pathname = usePathname()
  const activeSection = resolveProjectWorkspaceSection(
    pathname,
    username,
    projectSlug
  )

  return (
    <nav
      aria-label="Project workspace"
      className="border-border/70 bg-surface/70 shrink-0 border-b px-3 py-2"
    >
      <div className="flex flex-wrap gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.section
          const href = getHref(
            username,
            projectSlug,
            item.section,
            activeConversationId
          )

          return (
            <Link
              key={item.section}
              href={href}
              className={cn(
                "inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
