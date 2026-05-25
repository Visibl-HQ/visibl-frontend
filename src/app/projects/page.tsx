import type { Metadata } from "next"
import { AuthGuard } from "@/features/auth/components/auth-guard"
import { ProjectsDashboard } from "@/features/projects/components/projects-dashboard"

export const metadata: Metadata = {
  title: "Projects",
}

export default function Page() {
  return (
    <AuthGuard>
      <ProjectsDashboard />
    </AuthGuard>
  )
}
