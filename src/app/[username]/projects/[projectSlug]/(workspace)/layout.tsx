import { AuthGuard } from "@/features/auth/components/auth-guard"
import { WorkspaceProjectGate } from "@/features/workspace/components/workspace-project-gate"

type LayoutProps = {
  params: Promise<{ username: string; projectSlug: string }>
}

export default async function ProjectWorkspaceLayout({ params }: LayoutProps) {
  const { username, projectSlug } = await params

  return (
    <AuthGuard>
      <WorkspaceProjectGate username={username} projectSlug={projectSlug} />
    </AuthGuard>
  )
}
