import { notFound } from "next/navigation"

import {
  HostedPageEmailGate,
  PublicHostedPage,
} from "@/features/hosted-page/components/public-hosted-page"
import { ApiError } from "@/lib/api/client"
import { getPublicHostedPage } from "@/lib/api/hosted-pages"

type HostedPageProps = {
  params: Promise<{ identifier: string }>
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function HostedPage({
  params,
  searchParams,
}: HostedPageProps) {
  const { identifier } = await params
  const { token = null, email = null } = await searchParams
  const page = await getPublicHostedPage(identifier, { token, email }).catch(
    (error) => {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.message === "Email gate required"
      ) {
        return "email-gate" as const
      }
      return null
    }
  )

  if (page === "email-gate") {
    return <HostedPageEmailGate initialEmail={email} />
  }

  if (!page) {
    notFound()
  }

  return <PublicHostedPage page={page} token={token} email={email} />
}
