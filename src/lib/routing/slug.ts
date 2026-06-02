/** URL-safe slug from a display name (matches backend slugify rules). */
export function slugifyProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function projectNameFromSlug(
  slug: string,
  candidates: Array<{ name: string }>
): string | null {
  const match = candidates.find(
    (project) => slugifyProjectName(project.name) === slug
  )
  return match?.name ?? null
}
