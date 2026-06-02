export type ProjectWorkspaceSection = "chat" | "company-map" | "artifacts"

export {
  artifactsPath,
  companyMapPath,
  conversationPath,
  draftConversationPath,
  projectRootPath,
} from "@/lib/routing/paths"

export function resolveProjectWorkspaceSection(
  pathname: string,
  username: string,
  projectSlug: string
): ProjectWorkspaceSection {
  const projectRoot = `/${username}/projects/${projectSlug}`
  const prefix = `${projectRoot}/`

  if (pathname === projectRoot || pathname === `${projectRoot}/`) {
    return "chat"
  }

  if (!pathname.startsWith(prefix)) {
    return "chat"
  }

  const rest = pathname.slice(prefix.length)

  if (rest.startsWith("company-map")) {
    return "company-map"
  }

  if (rest.startsWith("artifacts")) {
    return "artifacts"
  }

  return "chat"
}

/** @deprecated Legacy `/projects/{publicId}` paths */
export function resolveLegacyProjectWorkspaceSection(
  pathname: string,
  projectPublicId: string
): ProjectWorkspaceSection {
  const projectRoot = `/projects/${projectPublicId}`
  const prefix = `${projectRoot}/`

  if (pathname === projectRoot || pathname === `${projectRoot}/`) {
    return "chat"
  }

  if (!pathname.startsWith(prefix)) {
    return "chat"
  }

  const rest = pathname.slice(prefix.length)

  if (rest.startsWith("company-map")) {
    return "company-map"
  }

  if (rest.startsWith("artifacts")) {
    return "artifacts"
  }

  return "chat"
}
