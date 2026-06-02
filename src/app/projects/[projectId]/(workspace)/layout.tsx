import { LegacyProjectRedirect } from "@/features/workspace/components/legacy-project-redirect"

type LayoutProps = {
  params: Promise<{ projectId: string }>
}

export default async function LegacyProjectWorkspaceLayout({
  params,
}: LayoutProps) {
  const { projectId } = await params

  return <LegacyProjectRedirect projectPublicId={projectId} />
}
