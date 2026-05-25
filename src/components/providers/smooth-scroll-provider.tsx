"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ReactLenis } from "lenis/react"

const MARKETING_PATHS = new Set(["/"])

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const enableLenis = MARKETING_PATHS.has(pathname)

  if (!enableLenis) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        anchors: {
          offset: 72,
        },
      }}
    >
      {children}
    </ReactLenis>
  )
}
