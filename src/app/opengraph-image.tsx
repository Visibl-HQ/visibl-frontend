import { ImageResponse } from "next/og"
import { siteConfig } from "@/config/site"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0f17",
        color: "#f8fafc",
        padding: 72,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ color: "#5eead4", fontSize: 30, fontWeight: 700 }}>
        {siteConfig.name}
      </div>
      <div
        style={{
          maxWidth: 860,
          fontSize: 72,
          fontWeight: 760,
          lineHeight: 1.02,
        }}
      >
        Turn rough startup ideas into public pages people can discover.
      </div>
      <div style={{ color: "#94a3b8", fontSize: 28 }}>
        Strategy, GTM, validation, and startup pages in one execution system.
      </div>
    </div>,
    size
  )
}
