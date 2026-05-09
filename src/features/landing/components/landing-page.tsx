import {
  ArrowRight,
  Circle,
  Compass,
  GitBranch,
  Globe2,
  Lock,
  Mail,
  Pin,
  Shield,
  type LucideIcon,
} from "lucide-react"
import { CinematicProductFrame } from "@/components/marketing/cinematic-product-frame"
import { ModeToggle } from "@/components/marketing/mode-toggle"
import { WordsPullUp } from "@/components/motion/words-pull-up"
import { Button } from "@/components/ui/button"
import { footerLinks, navItems } from "@/features/landing/data/landing"

const steps = [
  ["Context", "Talk through the messy version."],
  ["Map", "Fields and assumptions become visible."],
  ["Gate", "Artifacts wait for usable evidence."],
  ["Share", "Feedback returns as the next input."],
]

const rails = [
  [Pin, "Memory pins", "Facts and assumptions stay inspectable."],
  [Lock, "Evidence gates", "Weak claims do not ship as truth."],
  [GitBranch, "Idea commits", "Pivots become a visible trail."],
  [Globe2, "Hosted proof", "One page shares only what should be public."],
] satisfies Array<[LucideIcon, string, string]>

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen overflow-hidden">
      <AtmosphericNavbar />
      <main>
        <HeroSection />
        <FlowSection />
        <SystemSection />
        <MemoSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}

function AtmosphericNavbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-13 max-w-5xl items-center justify-between rounded-full border border-slate-950/10 bg-white/74 px-2.5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#090b11]/72"
      >
        <a
          href="#top"
          className="flex items-center gap-3 rounded-full pr-3 pl-1 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          <span className="grid size-9 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Compass className="size-4" aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight">Visibl</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.slice(0, 3).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground rounded-full px-3 py-2 text-sm font-medium transition hover:bg-slate-950/5 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none dark:hover:bg-white/8"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            asChild
            size="sm"
            className="hidden rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800 md:inline-flex dark:bg-white dark:text-slate-950"
          >
            <a href="#cta">
              Request access
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </nav>
    </header>
  )
}

function HeroSection() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-24">
      <Atmosphere />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mx-auto w-fit rounded-full border border-white/35 bg-white/28 px-4 py-1.5 text-xs font-medium text-white/92 shadow-sm backdrop-blur">
            Evidence-structured founder workspace
          </p>
          <h1 className="text-shadow-dusk mt-7 font-serif text-[clamp(3.45rem,7.6vw,7rem)] leading-[0.88] tracking-normal text-balance text-white">
            <WordsPullUp
              text="Build the startup story you can defend."
              className="justify-center"
            />
          </h1>
          <div className="relative z-10 mt-8 sm:mt-10 lg:mt-12">
            <HeroSignalMap />
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 font-medium text-pretty text-white/84 sm:text-lg">
              Visibl turns raw notes, investor questions, and shifting
              assumptions into a live company map, proof-gated artifacts, and
              one page you can share with confidence.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-6 text-slate-950 shadow-[0_18px_55px_rgba(255,255,255,0.22)] hover:bg-cyan-50"
              >
                <a href="#flow">
                  Watch the loop
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-white/32 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/18 hover:text-white"
              >
                <a href="#system">See the system</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <CinematicProductFrame />
        </div>
      </div>
    </section>
  )
}

function HeroSignalMap() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto hidden h-24 max-w-3xl sm:block"
    >
      <div className="absolute top-1/2 left-1/2 h-22 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/16 bg-white/[0.035] shadow-[inset_0_0_50px_rgba(255,255,255,0.08)]" />
      <div className="absolute inset-x-16 top-1/2 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <div className="absolute top-[18%] left-[30%] h-px w-[22%] rotate-[-14deg] bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" />
      <div className="absolute top-[68%] right-[25%] h-px w-[20%] rotate-[14deg] bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" />
      <div className="absolute top-1/2 left-[18%] size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.9)]" />
      <div className="absolute top-[22%] left-[36%] size-1.5 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(207,250,254,0.85)]" />
      <div className="absolute top-[58%] left-[50%] size-2 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.9)]" />
      <div className="absolute top-[30%] right-[28%] size-1.5 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(207,250,254,0.85)]" />
      <div className="absolute top-1/2 right-[15%] size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.9)]" />
      <div className="absolute top-[18%] left-[22%] rounded-full border border-white/28 bg-white/10 px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-white/72 uppercase backdrop-blur">
        context
      </div>
      <div className="absolute top-[62%] left-[42%] rounded-full border border-white/28 bg-white/10 px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-white/72 uppercase backdrop-blur">
        proof
      </div>
      <div className="absolute top-[16%] right-[18%] rounded-full border border-white/28 bg-white/10 px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-white/72 uppercase backdrop-blur">
        page
      </div>
    </div>
  )
}

function Atmosphere() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#415ee5_0%,#768cf0_30%,#c578b9_70%,#fbfaf6_100%)] dark:bg-[linear-gradient(180deg,#030712_0%,#101735_40%,#311426_76%,#08070a_100%)]" />
      <div className="star-field absolute inset-0 opacity-48" />
      <div className="absolute inset-x-[-18%] bottom-[-2%] h-[22vw] min-h-64 rounded-[50%_50%_0_0] bg-[linear-gradient(180deg,rgba(8,71,82,0.18),rgba(3,28,36,0.68)_54%,rgba(3,28,36,0))] [mask-image:linear-gradient(180deg,transparent_0%,black_24%,black_58%,transparent_100%)] opacity-90 dark:bg-[linear-gradient(180deg,rgba(16,105,118,0.16),rgba(2,8,16,0.74)_58%,rgba(2,8,16,0))]" />
      <div className="absolute inset-x-[-8%] bottom-[-18rem] h-[34rem] bg-[radial-gradient(ellipse_at_50%_18%,rgba(251,250,246,0.2),transparent_42%),linear-gradient(180deg,rgba(251,250,246,0)_0%,rgba(251,250,246,0.44)_34%,rgba(251,250,246,0.88)_70%,#fbfaf6_100%)] dark:bg-[radial-gradient(ellipse_at_50%_18%,rgba(8,7,10,0.18),transparent_42%),linear-gradient(180deg,rgba(8,7,10,0)_0%,rgba(8,7,10,0.44)_34%,rgba(8,7,10,0.88)_70%,#08070a_100%)]" />
      <div className="noise-layer absolute inset-0 opacity-[0.13]" />
    </div>
  )
}

function FlowSection() {
  return (
    <section
      id="flow"
      className="bg-background px-4 py-40 sm:px-6 sm:py-48 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.62fr_1.38fr] lg:items-center xl:gap-20">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-cyan-600 uppercase dark:text-cyan-300">
            Product flow
          </p>
          <h2 className="mt-4 max-w-xl font-serif text-[clamp(3rem,6vw,5rem)] leading-[0.94] tracking-normal">
            The page starts with the software moving.
          </h2>
          <p className="text-muted-foreground mt-6 max-w-md text-base leading-8">
            The loop is built in HTML, CSS, and React state so it can become the
            real product video later.
          </p>
        </div>
        <div className="lg:pl-6">
          <CinematicProductFrame />
        </div>
      </div>
    </section>
  )
}

function SystemSection() {
  return (
    <section id="system" className="px-4 py-44 sm:px-6 sm:py-56 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-rose-500 uppercase">
              System
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-[clamp(3rem,6vw,5rem)] leading-[0.94] tracking-normal">
              Four product rules. No filler.
            </h2>
          </div>
          <div className="border-border border-y">
            {steps.map(([label, text]) => (
              <div
                key={label}
                className="border-border grid gap-5 border-b py-6 last:border-b-0 sm:grid-cols-[0.28fr_0.72fr]"
              >
                <p className="text-muted-foreground font-mono text-xs">
                  {label}
                </p>
                <p className="text-xl leading-8 font-semibold tracking-tight">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-border mt-32 grid gap-12 border-t pt-16 sm:grid-cols-2 lg:grid-cols-4">
          {rails.map(([Icon, title, text]) => (
            <div key={title} className="max-w-xs">
              <span className="bg-foreground text-background grid size-10 place-items-center rounded-full">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MemoSection() {
  return (
    <section className="px-4 py-44 sm:px-6 sm:py-56 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative rotate-[-0.7deg] rounded-[1.4rem] border border-slate-200 bg-white p-8 shadow-[0_45px_110px_rgba(32,42,62,0.13)] sm:p-12 dark:border-white/10 dark:bg-[#10141f] dark:text-white">
          <div className="absolute -inset-3 -z-10 rotate-[1.2deg] rounded-[1.4rem] bg-slate-200/45 dark:bg-cyan-300/8" />
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
            Founder memo
          </p>
          <h2 className="mt-8 max-w-4xl font-serif text-[clamp(3rem,6vw,5.4rem)] leading-[0.92] tracking-normal">
            A clearer company story starts with knowing what is still unproven.
          </h2>
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection() {
  return (
    <section
      id="cta"
      className="relative isolate overflow-hidden px-4 py-32 text-center sm:px-6 sm:py-44 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent,#435fe2_36%,#d56fa9_100%)] dark:bg-[linear-gradient(180deg,transparent,#0a1430_36%,#301323_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_72%,transparent)_34%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-52 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--background)_34%,transparent)_42%,var(--background)_100%)]" />
      <div
        className="star-field absolute inset-0 -z-10 opacity-35"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-4xl text-white">
        <h2 className="font-serif text-[clamp(3.8rem,8vw,7rem)] leading-[0.88] tracking-normal">
          Build the page after the truth has a shape.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-white/82">
          Map the assumptions. Gate the artifacts. Publish the version that can
          survive a real conversation.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-cyan-50"
          >
            <a href="mailto:hello@visibl.me">
              Request beta access
              <Mail className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-border mx-auto grid max-w-6xl gap-8 border-t pt-8 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-foreground text-background grid size-9 place-items-center rounded-full">
              <Shield className="size-4" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Visibl</span>
          </div>
          <p className="text-muted-foreground mt-5 max-w-md text-sm leading-7">
            Evidence-structured founder workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {footerLinks.slice(0, 4).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            >
              <Circle className="size-1.5 fill-current" />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
