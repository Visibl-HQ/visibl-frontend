"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ModeToggle } from "@/components/marketing/mode-toggle"
import { VisiblLogo } from "@/components/layout/visibl-logo"
import { Button } from "@/components/ui/button"
import { layout } from "@/config/tokens"
import { LandingMobileNav } from "@/features/landing/components/landing-mobile-nav"
import { navItems } from "@/features/landing/data/landing"
import { cn } from "@/lib/utils"

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const overHero = !scrolled

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-200",
        overHero
          ? "border-white/10 bg-[#090b10]/88"
          : "border-border/70 bg-background/92"
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex h-14 items-center justify-between gap-4",
          layout.maxWidth,
          layout.containerPadding
        )}
      >
        <VisiblLogo href="/" inverted={overHero} />

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none",
                overHero
                  ? "text-white/72 hover:text-white focus-visible:ring-cyan-400/60"
                  : "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50"
              )}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LandingMobileNav inverted={overHero} />
          <ModeToggle inverted={overHero} />
          <Button
            asChild
            size="sm"
            className={cn(
              "rounded-md px-3 font-medium sm:hidden",
              overHero ? "bg-white text-[#090b10] hover:bg-cyan-50" : ""
            )}
          >
            <Link href="/login">Start</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              "hidden rounded-md md:inline-flex",
              overHero
                ? "border-white/16 bg-transparent text-white hover:bg-white/10 hover:text-white"
                : ""
            )}
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className={cn(
              "hidden rounded-md px-4 font-medium sm:inline-flex",
              overHero ? "bg-white text-[#090b10] hover:bg-cyan-50" : ""
            )}
          >
            <Link href="/login">
              Open workspace
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
