import type { Metadata } from "next"

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

/** Conversation UI is rendered by the parent workspace layout shell. */
export default function ConversationPage() {
  return null
}
