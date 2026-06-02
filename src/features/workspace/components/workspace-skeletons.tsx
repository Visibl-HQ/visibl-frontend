"use client"

import { Skeleton } from "@/components/ui/skeleton"

type WorkspaceLayoutSkeletonProps = {
  className?: string
}

export function WorkspaceLayoutSkeleton({
  className,
}: WorkspaceLayoutSkeletonProps = {}) {
  return (
    <div
      className={`grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] ${className ?? ""}`}
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <Skeleton className="hidden min-h-screen lg:block" />
      <Skeleton className="min-h-screen" />
      <Skeleton className="hidden min-h-screen lg:block" />
    </div>
  )
}

export function CompanyMapPanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export function ArtifactHubPanelSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2"
      aria-busy="true"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  )
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-16 ${index % 2 === 0 ? "w-3/4 self-start" : "w-2/3 self-end"}`}
        />
      ))}
    </div>
  )
}
