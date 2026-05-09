import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/marketing/section-heading"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/features/landing/data/landing"

export function FaqSection() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="The product is only valid if the logic is executable."
        description="These answers set the bar for the business model and product behavior instead of hiding behind broad AI claims."
      />
      <Accordion type="single" collapsible className="mx-auto mt-12 max-w-3xl">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-base">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-6">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}
