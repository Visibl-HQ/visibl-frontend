import { AppLogoMark } from "@/components/layout/app-logo-mark"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

type AppLogoBarProps = {
  href?: string
  showWordmark?: boolean
  actions?: React.ReactNode
  className?: string
}

/** Minimal top bar with swappable logo — use on app/auth pages. */
export function AppLogoBar({
  href = "/projects",
  showWordmark = true,
  actions,
  className,
}: AppLogoBarProps) {
  return (
    <header
      className={cn(
        "border-border/70 bg-background/95 shrink-0 border-b backdrop-blur-xl",
        className
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-4">
        <AppLogoMark href={href} showWordmark={showWordmark} size="sm" />
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </Container>
    </header>
  )
}
