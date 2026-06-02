import { ProjectEntry } from "@/features/projects/components/project-entry"

type PageProps = {
  params: Promise<{ username: string; projectSlug: string }>
}

export default async function ProjectSlugEntryPage({ params }: PageProps) {
  const { username, projectSlug } = await params

  return <ProjectEntry username={username} projectSlug={projectSlug} />
}
