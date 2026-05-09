"use client"

import * as React from "react"
import { ReactLenis } from "lenis/react"

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
      }}
    >
      {children}
    </ReactLenis>
  )
}
