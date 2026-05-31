"use client"

import { LogOut, ChevronsUpDown, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/components/auth-provider"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  compact?: boolean
  variant?: "default" | "sidebar"
  className?: string
}

function getInitials(username: string): string {
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
  }

  return username.slice(0, 2).toUpperCase()
}

export function UserMenu({
  compact = false,
  variant = "default",
  className,
}: UserMenuProps) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const initials = getInitials(user.username)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="outline"
            size="icon-sm"
            className={cn("size-8 shrink-0", className)}
            aria-label={`Account menu for ${user.username}`}
          >
            <UserRound className="size-4" aria-hidden="true" />
          </Button>
        ) : variant === "sidebar" ? (
          <button
            type="button"
            className={cn(
              "hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              className
            )}
          >
            <span
              className="bg-muted text-foreground grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold tracking-wide"
              aria-hidden="true"
            >
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-5 font-medium">
                {user.username}
              </span>
              <span className="text-muted-foreground block truncate text-xs leading-4">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <UserRound className="size-4" aria-hidden="true" />
            <span className="max-w-[10rem] truncate">{user.username}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{user.username}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout()
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
