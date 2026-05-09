import { Skeleton } from "@/components/ui/skeleton"
import { Container } from "@/components/layout/container"

export function LandingSkeleton() {
  return (
    <main className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="mx-auto mt-24 max-w-3xl space-y-6 text-center">
          <Skeleton className="mx-auto h-5 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mx-auto h-6 w-3/4" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="mt-16 h-96 w-full rounded-xl" />
      </Container>
    </main>
  )
}
