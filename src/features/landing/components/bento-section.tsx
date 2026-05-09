import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/marketing/section-heading"
import { bentoItems } from "@/features/landing/data/landing"
import { cn } from "@/lib/utils"

export function BentoSection() {
  return (
    <Section className="bg-surface/50">
      <SectionHeading
        eyebrow="Architecture"
        title="A SaaS foundation that can become the product."
        description="The landing page uses the same patterns the application should use: feature-owned sections, shared UI primitives, typed config, validated environment variables, and accessible defaults."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {bentoItems.map((item) => (
          <article
            key={item.title}
            className={cn(
              "border-border/70 bg-background relative min-h-60 overflow-hidden rounded-xl border p-6 shadow-sm",
              item.className
            )}
          >
            <div className="via-brand/70 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            <div className="bg-secondary text-foreground flex size-10 items-center justify-center rounded-lg">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
              {item.description}
            </p>
            <div className="border-brand/20 bg-brand/10 absolute right-6 bottom-6 h-24 w-24 rounded-full border blur-2xl" />
          </article>
        ))}
      </div>
    </Section>
  )
}
