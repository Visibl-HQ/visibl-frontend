"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqItems } from "@/features/landing/data/landing"

export function LandingFaqAccordion() {
  return (
    <Accordion type="multiple" className="w-full">
      {faqItems.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-4 text-sm leading-7 sm:text-base">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
