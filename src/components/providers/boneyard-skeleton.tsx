"use client"

import type { ReactNode } from "react"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"
import { Skeleton } from "@/components/ui/skeleton"

type NamedSkeletonProps = {
  name: string
  loading: boolean
  children: ReactNode
  className?: string
  fallback?: ReactNode
  fixture?: ReactNode
}

export function NamedSkeleton({
  name,
  loading,
  children,
  className,
  fallback,
  fixture,
}: NamedSkeletonProps) {
  return (
    <BoneyardSkeleton
      name={name}
      loading={loading}
      fixture={fixture}
      fallback={fallback ?? <Skeleton className="min-h-[120px] w-full" />}
      {...(className ? { className } : {})}
    >
      {children}
    </BoneyardSkeleton>
  )
}
