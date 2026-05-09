import Link from "next/link"
import { Check } from "lucide-react"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/marketing/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { plans } from "@/features/landing/data/landing"
import { cn } from "@/lib/utils"

export function PricingSection() {
  return (
    <Section id="pricing" className="bg-surface/50">
      <SectionHeading
        eyebrow="Pricing"
        title="Start with willingness to pay, not vanity usage."
        description="The starter includes pricing surfaces that can be wired into Stripe later without changing the landing architecture."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "bg-card rounded-xl border p-6 shadow-sm",
              plan.highlighted
                ? "border-brand shadow-brand/10"
                : "border-border/70"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {plan.description}
                </p>
              </div>
              {plan.highlighted ? (
                <Badge className="bg-brand text-brand-foreground">
                  Best fit
                </Badge>
              ) : null}
            </div>
            <div className="mt-7 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-normal">
                {plan.price}
              </span>
              {plan.price.startsWith("$") ? (
                <span className="text-muted-foreground pb-1 text-sm">/mo</span>
              ) : null}
            </div>
            <Button
              asChild
              className="mt-7 w-full"
              variant={plan.highlighted ? "default" : "outline"}
            >
              <Link href="#cta">{plan.cta}</Link>
            </Button>
            <ul className="mt-7 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="text-muted-foreground flex gap-3 text-sm"
                >
                  <Check className="text-brand mt-0.5 size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}
