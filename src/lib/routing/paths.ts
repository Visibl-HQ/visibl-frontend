import { DRAFT_CONVERSATION_ID } from "@/features/workspace/lib/conversation-routing"
import { slugifyProjectName } from "@/lib/routing/slug"

export type ProjectRouteParams = {
  username: string
  projectSlug: string
}

export function projectRootPath({ username, projectSlug }: ProjectRouteParams): string {
  return `/${username}/projects/${projectSlug}`
}

export function draftConversationPath(
  username: string,
  projectSlug: string
): string {
  return `/${username}/projects/${projectSlug}/conversations/${DRAFT_CONVERSATION_ID}`
}

export function conversationPath(
  username: string,
  projectSlug: string,
  conversationId: string
): string {
  return `/${username}/projects/${projectSlug}/conversations/${conversationId}`
}

export function companyMapPath(username: string, projectSlug: string): string {
  return `/${username}/projects/${projectSlug}/company-map`
}

export function artifactsPath(username: string, projectSlug: string): string {
  return `/${username}/projects/${projectSlug}/artifacts`
}

export function projectPathFromProject(
  username: string,
  project: { name: string }
): string {
  return projectRootPath({
    username,
    projectSlug: slugifyProjectName(project.name),
  })
}

export function legacyProjectPath(projectPublicId: string): string {
  return `/projects/${projectPublicId}`
}
