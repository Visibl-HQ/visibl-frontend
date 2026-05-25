import Link from "next/link"
import { cn } from "@/lib/utils"

type SkipLinkProps = {
  href?: string
  className?: string
}

export function SkipLink({ href = "#main-content", className }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-background text-foreground focus:ring-brand sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:outline-none",
        className
      )}
    >
      Skip to main content
    </Link>
  )
}
