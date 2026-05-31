import Link from "next/link"
import { Container } from "@/components/layout/container"
import { AppLogoMark } from "@/components/layout/app-logo-mark"
import { SectionLabel } from "@/components/marketing/section-label"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  label: string
  title?: string
  index?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function AppHeader({
  label,
  title,
  index,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/70 bg-background/90 z-40 shrink-0 border-b backdrop-blur-xl",
        className
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <AppLogoMark
            href="/projects"
            showWordmark
            size="sm"
            className="shrink-0"
          />
          {backHref ? (
            <>
              <span
                className="bg-border/80 hidden h-4 w-px shrink-0 sm:block"
                aria-hidden="true"
              />
              <Link
                href={backHref}
                className="text-muted-foreground hover:text-foreground hidden text-xs font-medium sm:inline"
              >
                ← {backLabel}
              </Link>
            </>
          ) : null}
          <div className="border-border/70 hidden min-w-0 border-l pl-4 sm:block">
            <SectionLabel {...(index ? { index } : {})}>{label}</SectionLabel>
            {title ? (
              <p className="truncate text-sm font-semibold tracking-tight">
                {title}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </Container>
    </header>
  )
}
