import * as React from "react"
import { layout } from "@/config/tokens"
import { cn } from "@/lib/utils"

type ContainerProps = React.ComponentPropsWithoutRef<"div">

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        layout.maxWidth,
        layout.containerPadding,
        className
      )}
      {...props}
    />
  )
}
