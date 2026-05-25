import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  Braces,
  Brain,
  ChartNoAxesCombined,
  CircleDot,
  FileLock2,
  GitBranch,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  MousePointer2,
  Pin,
  Radar,
  ShieldCheck,
  Sparkles,
  Split,
  Target,
  Telescope,
  type LucideIcon,
} from "lucide-react"

export type StoryStep = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}

export type NarrativeFeature = {
  title: string
  description: string
  detail: string
  icon: LucideIcon
}

export const navItems = [
  { index: "01", label: "Product", href: "#product" },
  { index: "02", label: "Workflow", href: "#workflow" },
  { index: "03", label: "Proof", href: "#proof" },
  { index: "04", label: "Philosophy", href: "#philosophy" },
] as const

export const heroStats = [
  { value: "01", label: "context session" },
  { value: "06", label: "field states" },
  { value: "09+", label: "living artifacts" },
]

export const productSignals = [
  "Company map",
  "Memory pins",
  "Artifact gates",
  "Idea commits",
  "Hosted proof",
  "Feedback loop",
]

export const workflowSteps: StoryStep[] = [
  {
    eyebrow: "Raw context",
    title: "Start where founders actually are.",
    description:
      "Notes, half-formed arguments, customer fragments, contradictions, and deadline pressure enter one deep conversation.",
    icon: MessageSquareText,
  },
  {
    eyebrow: "Structured map",
    title: "The company begins to take shape.",
    description:
      "Visibl extracts field cards, pins the facts that matter, and marks what is missing, vague, assumed, supported, or contradicted.",
    icon: Layers3,
  },
  {
    eyebrow: "Gated output",
    title: "Weak stories cannot publish as truth.",
    description:
      "Artifacts unlock only when the required context is usable. Unknowns stay visible instead of being hidden behind confident prose.",
    icon: FileLock2,
  },
  {
    eyebrow: "Public feedback",
    title: "The page becomes a learning surface.",
    description:
      "Hosted pages, gated sections, viewer feedback, and validation events feed back into the founder workspace.",
    icon: Globe2,
  },
]

export const narrativeFeatures: NarrativeFeature[] = [
  {
    title: "Memory that can be inspected",
    description:
      "Key facts, decisions, assumptions, risks, and insights are pinned while the conversation unfolds.",
    detail:
      "Founders can correct the system before those facts shape investor-facing output.",
    icon: Pin,
  },
  {
    title: "A company map with honest states",
    description:
      "Every critical field has a visible readiness state, not just polished text.",
    detail:
      "Missing, vague, assumed, supported, contradicted, and not applicable become product states.",
    icon: Radar,
  },
  {
    title: "Artifacts that know their dependencies",
    description:
      "Pitch pages, summaries, FAQs, and GTM plans are generated from structured context.",
    detail:
      "When the founder changes a core field, dependent artifacts can be marked stale.",
    icon: Braces,
  },
  {
    title: "A graph for strategic evolution",
    description:
      "Pivots, decisions, branches, and rollbacks become visible commits in the idea history.",
    detail:
      "The founder can show how they reached the current direction without exposing private transcripts.",
    icon: GitBranch,
  },
]

export const showcaseCards = [
  {
    icon: Target,
    title: "Proof gaps",
    text: "Unsupported claims are surfaced before they become investor copy.",
  },
  {
    icon: Split,
    title: "Alternate paths",
    text: "Explore different ICPs, pricing, or GTM motions without losing the original thread.",
  },
  {
    icon: ShieldCheck,
    title: "Publishing controls",
    text: "Public, gated, and private sections keep sensitive founder data under control.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Behavior loop",
    text: "Views, feedback, and validation events become the next iteration inputs.",
  },
]

export const proofItems = [
  {
    value: "Field card",
    label:
      "No artifact is treated as ready until its inputs are specific enough.",
    icon: CircleDot,
  },
  {
    value: "Commit",
    label: "Every meaningful strategy shift can become a visible snapshot.",
    icon: GitBranch,
  },
  {
    value: "Page",
    label: "The company package can be shared without exposing the workspace.",
    icon: Globe2,
  },
]

export const philosophyBullets = [
  "A founder's thinking deserves version control.",
  "Unknowns should be labeled before they are dressed up.",
  "The best investor artifact is downstream of a better company map.",
  "A hosted page is useful only if it returns evidence to the workspace.",
]

export const faqItems = [
  {
    question: "Is Visibl a pitch deck generator?",
    answer:
      "No. Decks and pages are outputs. The core product is the evidence-linked company map, memory pins, artifact gates, version history, and feedback loop underneath them.",
  },
  {
    question: "Why not just use ChatGPT or Claude?",
    answer:
      "General chat can produce good text, but it does not maintain field states, dependency-aware artifacts, idea commits, publishing controls, or page feedback as a durable workspace.",
  },
  {
    question: "What is the first wedge?",
    answer:
      "Early founders under a real deadline: accelerator applications, fundraising prep, first-user validation, or a public launch where unclear strategy has immediate cost.",
  },
  {
    question: "Is hosted discovery proven?",
    answer:
      "No. The product treats hosted pages as a shareable learning surface first. SEO and AI discovery are hypotheses that require external usage, indexing, and conversion evidence.",
  },
]

export const v1Capabilities = [
  {
    title: "Project workspaces",
    description:
      "Each startup gets its own project with conversations, memory pins, and a living problem-and-customer doc.",
    icon: Layers3,
  },
  {
    title: "Streaming intake chat",
    description:
      "Talk through the messy version. The assistant captures facts, updates checklist sections, and pins what matters.",
    icon: MessageSquareText,
  },
  {
    title: "Memory pins",
    description:
      "Metrics and notes surface in the sidebar as the conversation progresses — inspectable, not buried in chat history.",
    icon: Pin,
  },
  {
    title: "Problem & customer doc",
    description:
      "Eight checklist sections track target customer, severity, willingness to pay, and early validation with visible completion.",
    icon: Target,
  },
] as const

export const footerLinks = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Proof", href: "#proof" },
  { label: "Sign in", href: "/login" },
]

export const demoPins = [
  { label: "ICP", value: "first-time technical founders", state: "supported" },
  { label: "Trigger", value: "YC or fundraising deadline", state: "supported" },
  { label: "Risk", value: "ChatGPT substitution", state: "assumed" },
]

export const demoArtifacts = [
  { label: "Executive summary", progress: "ready", icon: BookOpenText },
  { label: "Investor FAQ", progress: "draftable", icon: Brain },
  { label: "Hosted page", progress: "locked", icon: LockKeyhole },
]

export const demoTimeline = [
  "Raw idea captured",
  "ICP narrowed",
  "Proof gap surfaced",
  "GTM branch explored",
]

export const ambientActions = [
  { icon: Sparkles, label: "Pin memory" },
  { icon: KeyRound, label: "Unlock artifact" },
  { icon: Activity, label: "Capture feedback" },
  { icon: MousePointer2, label: "Publish page" },
  { icon: Telescope, label: "Review signal" },
  { icon: BadgeCheck, label: "Commit decision" },
  { icon: ArrowUpRight, label: "Share" },
]

export const proofLogos = [
  "YC",
  "Notion",
  "DocSend",
  "Pitch",
  "Gamma",
  "ChatGPT",
]

export const metrics = [
  { value: "6", label: "field states before artifact readiness" },
  { value: "9+", label: "documents downstream of memory pins" },
  { value: "1", label: "shareable loop from page back to workspace" },
]

export const features = narrativeFeatures

export const bentoItems = showcaseCards.map((item, index) => ({
  title: item.title,
  description: item.text,
  icon: item.icon,
  className: index === 0 || index === 3 ? "lg:col-span-2" : "",
}))

export const testimonials = [
  {
    quote:
      "The useful part is not the writing. It is seeing which claims are real enough to share.",
    author: "Founder under accelerator deadline",
    role: "Early technical team",
    icon: MessageSquareText,
  },
  {
    quote:
      "The map makes the company easier to challenge before the deck makes it look finished.",
    author: "Pre-seed operator",
    role: "Investor review",
    icon: BadgeCheck,
  },
  {
    quote:
      "Versioned thinking is the artifact I did not know I wanted to show advisors.",
    author: "Solo founder",
    role: "B2B software",
    icon: GitBranch,
  },
]

export const plans = [
  {
    name: "Founder",
    price: "$29",
    description: "For one founder building a structured company package.",
    features: [
      "Context sessions",
      "Memory pins",
      "Company map",
      "Hosted pitch page",
    ],
    cta: "Request access",
    highlighted: false,
  },
  {
    name: "Studio",
    price: "$79",
    description: "For founders turning strategy into repeatable GTM motion.",
    features: [
      "All founder features",
      "GTM playbooks",
      "Advanced artifacts",
      "Page analytics",
    ],
    cta: "Join beta",
    highlighted: true,
  },
  {
    name: "Community",
    price: "Custom",
    description: "For accelerators and founder groups after self-serve proof.",
    features: [
      "Shared review workflows",
      "Portfolio pages",
      "Founder cohorts",
      "Admin reporting",
    ],
    cta: "Contact",
    highlighted: false,
  },
]

export const faqs = faqItems

export const heroSignals = ambientActions
