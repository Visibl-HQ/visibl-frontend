import * as React from "react"
import { Container } from "@/components/layout/container"
import { layout } from "@/config/tokens"
import { cn } from "@/lib/utils"

type SectionProps = React.ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string
}

export function Section({
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(layout.section, className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
