import type { Metadata } from "next"
import { AuthGuard } from "@/features/auth/components/auth-guard"
import { WorkspaceView } from "@/features/workspace/components/workspace-view"

type PageProps = {
  params: Promise<{ projectId: string; conversationId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params
  return {
    title: `Workspace · ${projectId.slice(0, 8)}`,
  }
}

export default async function Page({ params }: PageProps) {
  const { projectId, conversationId } = await params

  return (
    <AuthGuard>
      <WorkspaceView projectId={projectId} conversationId={conversationId} />
    </AuthGuard>
  )
}
