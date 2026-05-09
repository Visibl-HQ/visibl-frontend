import Link from "next/link"
import { ArrowRight, CheckCircle2, Play } from "lucide-react"
import { Container } from "@/components/layout/container"
import { MotionDiv } from "@/components/motion/motion-div"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { typography } from "@/config/tokens"
import { heroSignals } from "@/features/landing/data/landing"
import { staggerContainer } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function HeroSection() {
  return (
    <section className="border-border/70 relative overflow-hidden border-b bg-[radial-gradient(circle_at_top,var(--brand-muted),transparent_34rem)]">
      <Container className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <MotionDiv>
            <Badge
              variant="secondary"
              className="border-border/70 bg-background/70 gap-2 rounded-full border"
            >
              <span className="bg-brand size-1.5 rounded-full" />
              Founder execution system for startup discovery
            </Badge>
          </MotionDiv>

          <MotionDiv>
            <h1 className={cn(typography.h1, "mt-6")}>
              Turn rough startup ideas into public pages people can discover.
            </h1>
          </MotionDiv>

          <MotionDiv>
            <p className={cn(typography.lead, "mx-auto mt-6 max-w-2xl")}>
              Visibl converts product thinking, GTM logic, validation plans, and
              founder proof into one public startup page built for feedback,
              search, customers, and investor review.
            </p>
          </MotionDiv>

          <MotionDiv className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11">
              <Link href="#cta">
                Build the first page
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-background/60 h-11"
            >
              <Link href="#product">
                <Play className="size-4" />
                View product flow
              </Link>
            </Button>
          </MotionDiv>
        </div>

        <MotionDiv
          variants={staggerContainer}
          className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
        >
          {heroSignals.map((signal) => (
            <MotionDiv
              key={signal.label}
              className="border-border/70 bg-background/70 text-muted-foreground flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm backdrop-blur"
            >
              <signal.icon className="text-brand size-4" />
              {signal.label}
            </MotionDiv>
          ))}
        </MotionDiv>

        <MotionDiv className="mx-auto mt-12 max-w-6xl">
          <div className="border-border/80 bg-surface-elevated/80 shadow-primary/5 rounded-2xl border p-2 shadow-2xl backdrop-blur">
            <div className="border-border/70 bg-background overflow-hidden rounded-xl border">
              <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-muted-foreground text-xs">
                  visibl.me/startups/atlas
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.4fr]">
                <aside className="border-border/70 bg-muted/20 border-b p-5 lg:border-r lg:border-b-0">
                  <div className="text-muted-foreground text-xs font-medium uppercase">
                    Strategy state
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      "ICP locked",
                      "Pricing test active",
                      "SEO page published",
                      "Investor memo clean",
                    ].map((item) => (
                      <div
                        key={item}
                        className="bg-background flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                      >
                        <CheckCircle2 className="text-brand size-4" />
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>
                <div className="p-5 sm:p-7">
                  <div className="border-border from-background via-background to-brand-muted/30 rounded-xl border bg-gradient-to-br p-5">
                    <div className="max-w-2xl">
                      <div className="text-brand text-sm font-medium">
                        Public startup page
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">
                        AI-native workspace for startup clarity and demand
                        generation
                      </h2>
                      <p className="text-muted-foreground mt-3 text-sm leading-6">
                        Problem, customer trigger, proof, roadmap, pricing, and
                        next asks are generated from the same verified strategy
                        source.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        "39 interview targets",
                        "12 buyer replies",
                        "$1K revenue path",
                      ].map((item) => (
                        <div
                          key={item}
                          className="border-border bg-background/80 rounded-lg border p-3"
                        >
                          <div className="text-sm font-medium">{item}</div>
                          <div className="bg-muted mt-2 h-1.5 rounded-full">
                            <div className="bg-brand h-1.5 w-2/3 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </Container>
    </section>
  )
}
