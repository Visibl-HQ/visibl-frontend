import { AuthGuard } from "@/features/auth/components/auth-guard"
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell"

type LayoutProps = {
  params: Promise<{ projectId: string }>
}

export default async function ConversationsLayout({ params }: LayoutProps) {
  const { projectId } = await params

  return (
    <AuthGuard>
      <WorkspaceShell key={projectId} projectId={projectId} />
    </AuthGuard>
  )
}
