import Link from "next/link"
import {
  ArrowRight,
  Circle,
  Globe2,
  GitBranch,
  Lock,
  Mail,
  Pin,
  type LucideIcon,
} from "lucide-react"
import { CinematicProductFrame } from "@/components/marketing/cinematic-product-frame"
import { SkipLink } from "@/components/layout/skip-link"
import { Button } from "@/components/ui/button"
import { layout, typography } from "@/config/tokens"
import { siteConfig } from "@/config/site"
import { LandingFaqAccordion } from "@/features/landing/components/landing-faq-accordion"
import { LandingNavbar } from "@/features/landing/components/landing-navbar"
import { WorkspacePreviewStrip } from "@/features/landing/components/workspace-preview-strip"
import {
  footerLinks,
  metrics,
  narrativeFeatures,
  philosophyBullets,
  v1Capabilities,
  workflowSteps,
} from "@/features/landing/data/landing"
import { cn } from "@/lib/utils"

const futureRails = [
  [Pin, "Memory pins", "Facts and assumptions stay inspectable."],
  [Lock, "Evidence gates", "Weak claims do not ship as truth."],
  [GitBranch, "Idea commits", "Pivots become a visible trail."],
  [Globe2, "Hosted proof", "One page shares only what should be public."],
] satisfies Array<[LucideIcon, string, string]>

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <SkipLink />
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <ProductSection />
        <WorkflowSection />
        <ProofSection />
        <PhilosophySection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}

function HeroSection() {
  return (
    <section
      id="top"
      className="technical-hero landing-section relative isolate overflow-hidden pt-24 pb-16 text-white sm:pt-28 sm:pb-20"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[var(--background)]" />
      <div
        className={cn(
          "relative z-10 mx-auto",
          layout.maxWidth,
          layout.containerPadding
        )}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className={cn(typography.eyebrow, "text-white/60")}>
            Evidence workspace
          </p>
          <h1 className={cn(typography.h1, "mt-5 text-white")}>
            Build the startup story you can defend.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {siteConfig.description} Sign in, open a project, and work through
            customer problem, validation, and proof in one workspace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 w-full rounded-md bg-white px-5 text-[#090b10] hover:bg-cyan-50 sm:w-auto"
            >
              <Link href="/login">
                Continue with Google
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 w-full rounded-md border-white/18 bg-white/6 px-5 text-white hover:bg-white/10 sm:w-auto"
            >
              <a href="#workflow">See the workflow</a>
            </Button>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <CinematicProductFrame />
        </div>
      </div>
    </section>
  )
}

function ProductSection() {
  return (
    <section
      id="product"
      className={cn(
        "landing-section bg-background",
        layout.containerPadding,
        layout.landingSection
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            <p className={typography.eyebrow}>In the product today</p>
            <h2 className={cn(typography.h2, "mt-3")}>
              A founder workspace you can sign into now.
            </h2>
            <p className={cn(typography.lead, "mt-4")}>
              v1 ships the core loop: Google sign-in, a projects dashboard, and
              a three-column workspace with streaming chat, memory pins, and a
              problem-and-customer checklist that fills in as you talk.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="border-border/70 bg-card rounded-lg border px-3 py-3"
                >
                  <p className="text-xl font-semibold tabular-nums">
                    {metric.value}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <WorkspacePreviewStrip />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {v1Capabilities.map((capability) => (
            <article
              key={capability.title}
              className="border-border/70 bg-card rounded-lg border p-5 shadow-sm"
            >
              <capability.icon
                className="text-brand size-5"
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {capability.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkflowSection() {
  return (
    <section
      id="workflow"
      className={cn(
        "landing-section border-border/70 bg-muted/20 border-t",
        layout.containerPadding,
        layout.landingSection
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className={typography.eyebrow}>Workflow</p>
          <h2 className={cn(typography.h2, "mt-3")}>
            From messy context to a map you can challenge.
          </h2>
          <p className={cn(typography.lead, "mt-4")}>
            The full Visibl arc runs from raw founder notes to hosted proof. v1
            starts with intake: conversation, pins, and the problem-and-customer
            doc.
          </p>
        </div>

        <ol className="border-border mt-10 border-y">
          {workflowSteps.map((step, index) => (
            <li
              key={step.title}
              className="border-border grid gap-4 border-b py-6 last:border-b-0 sm:grid-cols-[5rem_1fr]"
            >
              <div className="flex items-start sm:justify-center">
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <p className={typography.eyebrow}>{step.eyebrow}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProofSection() {
  return (
    <section
      id="proof"
      className={cn(
        "landing-section bg-background",
        layout.containerPadding,
        layout.landingSection
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            <p className={typography.eyebrow}>Why Visibl</p>
            <h2 className={cn(typography.h2, "mt-3")}>
              Not another chatbot with a prettier export button.
            </h2>
            <p className={cn(typography.lead, "mt-4")}>
              General chat can produce good text. Visibl keeps field states,
              memory pins, artifact gates, and version history as durable
              product surfaces — not buried prompts.
            </p>
          </div>
          <div className="space-y-4">
            {narrativeFeatures.map((feature) => (
              <article
                key={feature.title}
                className="border-border/70 bg-card rounded-lg border p-4 shadow-sm"
              >
                <feature.icon
                  className="text-brand size-5"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7">
                  {feature.description}
                </p>
                <p className="text-muted-foreground/80 mt-2 text-sm leading-7">
                  {feature.detail}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="border-border mt-12 grid gap-8 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {futureRails.map(([Icon, title, text]) => (
            <div key={title}>
              <Icon
                className="text-muted-foreground size-5"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PhilosophySection() {
  return (
    <section
      id="philosophy"
      className={cn(
        "landing-section border-border/70 bg-muted/20 border-t",
        layout.containerPadding,
        layout.landingSection
      )}
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="border-border/70 bg-card rounded-lg border p-6 shadow-sm sm:p-8">
          <p className={typography.eyebrow}>Founder philosophy</p>
          <h2 className={cn(typography.h2, "mt-3 text-2xl sm:text-3xl")}>
            A clearer company story starts with knowing what is still unproven.
          </h2>
          <ul className="mt-6 space-y-3">
            {philosophyBullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm leading-7">
                <Circle
                  className="text-brand mt-2 size-1.5 shrink-0 fill-current"
                  aria-hidden="true"
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div id="faq">
          <p className={typography.eyebrow}>Questions</p>
          <h2 className={cn(typography.h2, "mt-3 text-2xl sm:text-3xl")}>
            What founders ask first
          </h2>
          <div className="mt-6">
            <LandingFaqAccordion />
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection() {
  return (
    <section
      id="cta"
      className={cn(
        "landing-section border-border/70 border-y text-center",
        layout.containerPadding,
        layout.landingSection
      )}
    >
      <div className="mx-auto max-w-3xl">
        <p className={typography.eyebrow}>Get started</p>
        <h2 className={cn(typography.h2, "mt-3")}>
          Open a project and start the intake conversation.
        </h2>
        <p className={cn(typography.lead, "mx-auto mt-4 max-w-xl")}>
          Sign in with Google, create a project, and let Visibl capture memory
          pins and problem-and-customer progress while you talk.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-md px-5 sm:w-auto"
          >
            <Link href="/login">
              Open workspace
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-md px-5 sm:w-auto"
          >
            <a href={`mailto:${siteConfig.supportEmail}`}>
              Talk to us
              <Mail className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const productLinks = footerLinks.filter((link) => link.href.startsWith("#"))
  const accountLinks = footerLinks.filter((link) => link.href.startsWith("/"))

  return (
    <footer
      className={cn(
        "bg-muted/30 border-border/70 border-t",
        layout.containerPadding,
        "py-10"
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-semibold tracking-tight">{siteConfig.name}</p>
            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-7">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Get started</p>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
                >
                  Contact founders
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-muted-foreground mt-10 text-xs">
          © {new Date().getFullYear()} {siteConfig.name}. Evidence-structured
          founder workspace.
        </p>
      </div>
    </footer>
  )
}
