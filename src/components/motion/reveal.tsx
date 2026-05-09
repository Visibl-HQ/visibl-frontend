"use client"

import * as React from "react"
import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return <div className={cn(className)}>{children}</div>
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(className)}>{children}</div>
}

export const staggerChild: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

export function SoftReveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
