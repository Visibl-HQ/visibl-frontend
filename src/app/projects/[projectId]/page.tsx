import { LegacyProjectRedirect } from "@/features/workspace/components/legacy-project-redirect"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function LegacyProjectEntryPage({ params }: PageProps) {
  const { projectId } = await params

  return <LegacyProjectRedirect projectPublicId={projectId} />
}
