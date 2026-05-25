"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"

export function ModeToggle() {
  const mounted = useMounted()
  const { setTheme, theme } = useTheme()

  if (!mounted) {
    return (
      <Button
        aria-label="Theme loading"
        variant="ghost"
        size="icon-sm"
        disabled={true}
      >
        <Monitor className="size-4" />
      </Button>
    )
  }

  const nextTheme =
    theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <Button
      aria-label={`Switch theme to ${nextTheme}`}
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="size-4" />
    </Button>
  )
}
