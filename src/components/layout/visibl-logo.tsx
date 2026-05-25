import Link from "next/link"
import { Compass } from "lucide-react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

type VisiblLogoProps = {
  href?: string
  className?: string
  inverted?: boolean
}

export function VisiblLogo({
  href = "/",
  className,
  inverted = false,
}: VisiblLogoProps) {
  const mark = (
    <>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-md border",
          inverted
            ? "border-white/12 bg-white text-[#090b10]"
            : "border-border/70 bg-foreground text-background",
        )}
      >
        <Compass className="size-4" aria-hidden="true" />
      </span>
      <span className="font-semibold tracking-tight">{siteConfig.name}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
        {mark}
      </Link>
    )
  }

  return <div className={cn("inline-flex items-center gap-3", className)}>{mark}</div>
}
