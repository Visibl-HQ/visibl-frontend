"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { assets } from "@/config/assets"
import { siteConfig } from "@/config/site"

type AppLogoMarkProps = {
  href?: string
  showWordmark?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  inverted?: boolean
}

const sizeClasses = {
  sm: "size-7 rounded-md",
  md: "size-9 rounded-md",
  lg: "size-11 rounded-lg",
} as const

const imageSizes = {
  sm: 28,
  md: 36,
  lg: 44,
} as const

function LogoPlaceholder({
  size = "md",
  inverted = false,
}: {
  size?: AppLogoMarkProps["size"]
  inverted?: boolean
}) {
  return (
    <span
      className={cn(
        "border-border/70 bg-muted/40 grid shrink-0 place-items-center border",
        sizeClasses[size],
        inverted && "border-white/12 bg-white/10"
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "font-serif text-sm font-semibold tracking-tight",
          inverted ? "text-white" : "text-foreground"
        )}
      >
        V
      </span>
    </span>
  )
}

/**
 * Swappable logo mark for app shells. Replace `assets.brandLogo` when design ships.
 */
export function AppLogoMark({
  href = "/",
  showWordmark = true,
  size = "md",
  className,
  inverted = false,
}: AppLogoMarkProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const px = imageSizes[size]

  const mark =
    logoFailed || !assets.brandLogo ? (
      <LogoPlaceholder size={size} inverted={inverted} />
    ) : (
      <Image
        src={assets.brandLogo}
        alt={`${siteConfig.name} logo`}
        width={px}
        height={px}
        className={cn("shrink-0 object-contain", sizeClasses[size])}
        onError={() => setLogoFailed(true)}
      />
    )

  const content = (
    <>
      {mark}
      {showWordmark ? (
        <span
          className={cn(
            "font-semibold tracking-tight",
            inverted && "text-white"
          )}
        >
          {siteConfig.name}
        </span>
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-w-0 items-center",
          showWordmark ? "gap-3" : "",
          className
        )}
        aria-label={`${siteConfig.name} home`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center",
        showWordmark ? "gap-3" : "",
        className
      )}
    >
      {content}
    </div>
  )
}
