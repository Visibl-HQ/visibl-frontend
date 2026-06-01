"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import { useMounted } from "@/hooks/use-mounted"
import { fadeUp } from "@/lib/motion"

type MotionDivProps = HTMLMotionProps<"div">

export function MotionDiv({
  variants = fadeUp,
  viewport,
  ...props
}: MotionDivProps) {
  const reduceMotion = useReducedMotion()
  const mounted = useMounted()
  const shouldAnimate = mounted && !reduceMotion
  const resolvedViewport = viewport ?? { once: true, amount: 0.2 }

  if (!shouldAnimate) {
    return <motion.div initial={false} viewport={resolvedViewport} {...props} />
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={resolvedViewport}
      variants={variants}
      {...props}
    />
  )
}
