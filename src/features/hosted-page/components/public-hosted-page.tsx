"use client"

import { FormEvent, useEffect, useState } from "react"
import { ArrowUpRight, Loader2, Send } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  recordHostedPageEvent,
  submitHostedPageFeedback,
} from "@/lib/api/hosted-pages"
import type { HostedPagePublicRead } from "@/lib/api/types"

type PublicHostedPageProps = {
  page: HostedPagePublicRead
  token?: string | null
  email?: string | null
}

type HostedPageEmailGateProps = {
  initialEmail?: string | null
}

function safeContactHref(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }
  try {
    const url = new URL(value)
    return ["https:", "http:", "mailto:"].includes(url.protocol)
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function HostedPageEmailGate({
  initialEmail = null,
}: HostedPageEmailGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState(initialEmail ?? "")
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.")
      return
    }
    const params = new URLSearchParams({ email: trimmedEmail })
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <main className="bg-background flex min-h-screen items-center px-4 py-10">
      <section className="border-border/80 bg-surface-elevated mx-auto w-full max-w-md rounded-lg border p-6">
        <p className="text-muted-foreground text-sm font-medium">
          Email gated page
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Enter your email</h1>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <label className="text-sm font-medium" htmlFor="gate-email">
            Email
          </label>
          <input
            id="gate-email"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            required
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </section>
    </main>
  )
}

export function PublicHostedPage({
  page,
  token = null,
  email = null,
}: PublicHostedPageProps) {
  const [body, setBody] = useState("")
  const [contactEmail, setContactEmail] = useState(email ?? "")
  const [feedbackType, setFeedbackType] = useState<
    "comment" | "objection" | "intro_request" | "question"
  >("comment")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const projection = page.projection
  const pageMeta = projection.page
  const contactHref = safeContactHref(pageMeta?.contact_method)

  useEffect(() => {
    void recordHostedPageEvent(
      page.public_id,
      {
        event_type: "page_view",
        referrer: document.referrer || null,
      },
      { token, email }
    ).catch(() => undefined)
  }, [email, page.public_id, token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim()) {
      return
    }
    setIsSubmitting(true)
    try {
      await submitHostedPageFeedback(
        page.public_id,
        {
          feedback_type: feedbackType,
          body: body.trim(),
          contact_email: contactEmail.trim() || null,
        },
        { token, email }
      )
      setBody("")
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="border-border/70 border-b px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-muted-foreground text-sm font-medium">
            {page.slug}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
            {projection.artifacts[0]?.title ?? "Investor page"}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-3xl text-base">
            {projection.artifacts[0]?.summary ??
              "Source-backed company context and investor artifacts."}
          </p>
          {contactHref ? (
            <Button
              asChild
              className="mt-6"
              onClick={() =>
                void recordHostedPageEvent(
                  page.public_id,
                  { event_type: "cta_click" },
                  { token, email }
                ).catch(() => undefined)
              }
            >
              <a href={contactHref}>
                {pageMeta?.cta_text ?? "Start a conversation"}
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-12">
        <div className="space-y-8">
          {projection.fields.length ? (
            <section>
              <h2 className="text-xl font-semibold">Company Map</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {projection.fields.map((field) => (
                  <article
                    key={field.key}
                    className="border-border/80 rounded-lg border p-4"
                  >
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="mt-2 text-sm">
                      {field.value ?? field.summary ?? "Shared summary"}
                    </p>
                    <p className="text-muted-foreground mt-3 text-xs">
                      {field.support_label}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {projection.artifacts.map((artifact, artifactIndex) => (
            <section
              key={`${artifact.artifact_id}-${artifact.artifact_version_number}-${artifactIndex}`}
            >
              <h2 className="text-xl font-semibold">{artifact.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {artifact.summary}
              </p>
              {artifact.sections.length ? (
                <div className="mt-4 space-y-3">
                  {artifact.sections.map((section) => (
                    <article
                      key={section.id}
                      className="border-border/80 rounded-lg border p-4"
                    >
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="mt-2 text-sm">{section.value}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="border-border/80 h-fit rounded-lg border p-4">
          <h2 className="font-semibold">Feedback</h2>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <select
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={feedbackType}
              onChange={(event) =>
                setFeedbackType(
                  event.target.value as
                    | "comment"
                    | "objection"
                    | "intro_request"
                    | "question"
                )
              }
            >
              <option value="comment">Comment</option>
              <option value="objection">Objection</option>
              <option value="intro_request">Intro request</option>
              <option value="question">Question</option>
            </select>
            <textarea
              className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={5000}
              required
            />
            <input
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="email@example.com"
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send feedback
            </Button>
            {submitted ? (
              <p className="text-muted-foreground text-sm">Feedback sent.</p>
            ) : null}
          </form>
        </aside>
      </div>
    </main>
  )
}
