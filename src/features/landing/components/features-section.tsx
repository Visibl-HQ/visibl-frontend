import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/marketing/section-heading"
import { MotionDiv } from "@/components/motion/motion-div"
import { features } from "@/features/landing/data/landing"
import { staggerContainer } from "@/lib/motion"

export function FeaturesSection() {
  return (
    <Section id="product">
      <SectionHeading
        eyebrow="Product system"
        title="Everything needed to move from narrative to proof."
        description="The foundation is designed around server-rendered content, reusable primitives, and thin client islands, so the product can scale without turning into a client-heavy page builder."
      />
      <MotionDiv
        variants={staggerContainer}
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <MotionDiv
            key={feature.title}
            className="border-border/70 bg-card hover:border-brand/40 rounded-xl border p-6 shadow-sm transition-colors"
          >
            <div className="bg-brand-muted text-brand flex size-10 items-center justify-center rounded-lg">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              {feature.description}
            </p>
          </MotionDiv>
        ))}
      </MotionDiv>
    </Section>
  )
}
