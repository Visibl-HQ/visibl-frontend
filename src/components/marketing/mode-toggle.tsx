"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

type ModeToggleProps = {
  inverted?: boolean
  className?: string
}

export function ModeToggle({ inverted = false, className }: ModeToggleProps) {
  const mounted = useMounted()
  const { setTheme, theme } = useTheme()

  const buttonClass = cn(
    inverted &&
      "text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-cyan-400/60",
    className
  )

  if (!mounted) {
    return (
      <Button
        aria-label="Theme loading"
        variant="ghost"
        size="icon-sm"
        disabled={true}
        className={buttonClass}
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
      className={buttonClass}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="size-4" />
    </Button>
  )
}
