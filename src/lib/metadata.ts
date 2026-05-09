import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

type MetadataInput = {
  title?: string
  description?: string
  path?: string
  image?: string
}

export function constructMetadata({
  title = `${siteConfig.name} - Evidence-structured founder workspace`,
  description = siteConfig.description,
  path = "/",
  image = "/opengraph-image",
}: MetadataInput = {}): Metadata {
  const url = new URL(path, siteConfig.url)

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} product preview`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}
