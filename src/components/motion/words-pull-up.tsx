"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export function WordsPullUp({
  text,
  className,
  wordClassName,
}: {
  text: string
  className?: string
  wordClassName?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" })
  const reduceMotion = useReducedMotion()

  return (
    <div ref={ref} className={cn("inline-flex flex-wrap", className)}>
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={
            reduceMotion ? false : { y: 16, opacity: 0.38, filter: "blur(8px)" }
          }
          {...(isInView
            ? { animate: { y: 0, opacity: 1, filter: "blur(0px)" } }
            : {})}
          transition={{
            duration: 0.62,
            delay: index * 0.036,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn("mr-[0.22em] inline-block", wordClassName)}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}
