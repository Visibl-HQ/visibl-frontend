import Link from "next/link"
import { Code2, MessageCircle } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/config/site"

export function Footer() {
  return (
    <footer className="border-border/70 bg-surface/50 border-t">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
                V
              </span>
              <span className="text-sm font-semibold">{siteConfig.name}</span>
            </div>
            <p className="text-muted-foreground mt-3 max-w-md text-sm">
              {siteConfig.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={siteConfig.links.github}
              aria-label="GitHub"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <Code2 className="size-4" />
            </Link>
            <Link
              href={siteConfig.links.x}
              aria-label="X"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <MessageCircle className="size-4" />
            </Link>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
