import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/marketing/section-heading"
import { testimonials } from "@/features/landing/data/landing"

export function TestimonialsSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Operator proof"
        title="Designed for founders who need sharper decisions."
        description="Use these placeholders as content contracts: replace each quote with verified user evidence before launch."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.author}
            className="border-border/70 bg-card rounded-xl border p-6 shadow-sm"
          >
            <testimonial.icon className="text-brand size-5" />
            <blockquote className="text-foreground mt-5 text-base leading-7">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6">
              <div className="font-medium">{testimonial.author}</div>
              <div className="text-muted-foreground text-sm">
                {testimonial.role}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
