import { Section } from "@/components/layout/section"
import { metrics, proofLogos } from "@/features/landing/data/landing"

export function SocialProofSection() {
  return (
    <Section
      id="proof"
      className="border-border/70 bg-surface/50 border-b"
      containerClassName="space-y-10"
    >
      <div className="text-muted-foreground text-center text-sm">
        Built for the operating standard expected by serious SaaS founders
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {proofLogos.map((logo) => (
          <div
            key={logo}
            className="border-border/70 bg-background text-muted-foreground flex h-16 items-center justify-center rounded-lg border text-sm font-semibold"
          >
            {logo}
          </div>
        ))}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="border-border/70 bg-background rounded-xl border p-5 text-center"
          >
            <dt className="text-3xl font-semibold tracking-normal">
              {metric.value}
            </dt>
            <dd className="text-muted-foreground mt-2 text-sm">
              {metric.label}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
