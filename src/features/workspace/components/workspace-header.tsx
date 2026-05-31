"use client"

import Link from "next/link"
import { ChevronLeft, Plus } from "lucide-react"
import { AppLogoMark } from "@/components/layout/app-logo-mark"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/features/projects/components/user-menu"
import { cn } from "@/lib/utils"

type WorkspaceHeaderProps = {
  projectName: string
  onNewConversation: () => void | Promise<void>
  className?: string
}

/** Mobile-only chrome — desktop navigation lives in the sidebar. */
export function WorkspaceHeader({
  projectName,
  onNewConversation,
  className,
}: WorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/70 bg-background/95 z-40 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-xl lg:hidden",
        className
      )}
    >
      <AppLogoMark
        href="/projects"
        showWordmark={false}
        size="sm"
        className="shrink-0"
      />

      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="size-8 shrink-0"
        aria-label="Back to projects"
      >
        <Link href="/projects">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
        {projectName}
      </h1>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-8 shrink-0"
        aria-label="New conversation"
        onClick={() => void onNewConversation()}
      >
        <Plus className="size-4" aria-hidden="true" />
      </Button>

      <UserMenu compact />
    </header>
  )
}
