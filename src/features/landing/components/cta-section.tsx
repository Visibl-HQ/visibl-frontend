import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Section } from "@/components/layout/section"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <Section id="cta" className="pt-0 pb-20 md:pb-28">
      <div className="border-border/70 bg-primary text-primary-foreground shadow-primary/10 overflow-hidden rounded-2xl border px-6 py-12 text-center shadow-2xl sm:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-primary-foreground/70 text-sm font-medium">
            Build the first visible proof surface
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-balance sm:text-5xl">
            Launch a startup page that forces the right strategy work.
          </h2>
          <p className="text-primary-foreground/70 mx-auto mt-5 max-w-2xl text-sm leading-6 text-pretty sm:text-base">
            Use this foundation as the production landing layer, then connect
            authentication, billing, onboarding, and the core page-generation
            workflow.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="secondary" size="lg" className="h-11">
              <Link href="#pricing">
                Choose plan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground h-11 bg-transparent"
            >
              <Link href="mailto:founders@visibl.me">Request review</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
