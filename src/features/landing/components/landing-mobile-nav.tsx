"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navItems } from "@/features/landing/data/landing"
import { cn } from "@/lib/utils"

type LandingMobileNavProps = {
  inverted?: boolean
}

export function LandingMobileNav({ inverted = false }: LandingMobileNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className={cn(
            "md:hidden",
            inverted &&
              "border-white/16 bg-transparent text-white hover:bg-white/10 hover:text-white"
          )}
          aria-label="Open page sections"
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {navItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <a href={item.href}>{item.label}</a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">Sign in</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/login">Open workspace</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
