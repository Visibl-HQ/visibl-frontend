import type { Metadata } from "next"
import { AuthGuard } from "@/features/auth/components/auth-guard"
import { ProjectEntry } from "@/features/projects/components/project-entry"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params
  return {
    title: `Project ${projectId.slice(0, 8)}`,
  }
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params

  return (
    <AuthGuard>
      <ProjectEntry projectId={projectId} />
    </AuthGuard>
  )
}
