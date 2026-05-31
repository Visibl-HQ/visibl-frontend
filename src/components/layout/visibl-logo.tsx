import { AppLogoMark } from "@/components/layout/app-logo-mark"

type VisiblLogoProps = {
  href?: string
  className?: string
  inverted?: boolean
  showWordmark?: boolean
  size?: "sm" | "md" | "lg"
}

/** Marketing-facing logo — delegates to swappable AppLogoMark. */
export function VisiblLogo({
  href = "/",
  className,
  inverted = false,
  showWordmark = true,
  size = "md",
}: VisiblLogoProps) {
  return (
    <AppLogoMark
      href={href}
      showWordmark={showWordmark}
      size={size}
      inverted={inverted}
      {...(className ? { className } : {})}
    />
  )
}
