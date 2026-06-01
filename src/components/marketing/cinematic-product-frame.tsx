"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Check,
  FileText,
  GitBranch,
  MessageSquareText,
  MousePointer2,
  Pin,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

const scenes = [
  {
    id: "chat",
    label: "Context",
    title: "A founder talks through the rough version.",
    note: "No forms. Just a focused conversation.",
  },
  {
    id: "pins",
    label: "Memory",
    title: "Important details become visible.",
    note: "Facts, risks, and assumptions stay on screen.",
  },
  {
    id: "artifact",
    label: "Artifacts",
    title: "Documents start forming from the conversation.",
    note: "The output follows the context.",
  },
  {
    id: "share",
    label: "Share",
    title: "The founder leaves with a clean package.",
    note: "A page, a summary, and a next step.",
  },
] as const

type SceneId = (typeof scenes)[number]["id"]

export function CinematicProductFrame({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(true)
  const reduceMotion = useReducedMotion()
  const mounted = useMounted()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const scene = scenes[index] ?? scenes[0]
  const shouldAnimate = mounted && !reduceMotion

  React.useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false)
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!shouldAnimate || !isVisible) return
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % scenes.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [shouldAnimate, isVisible])

  return (
    <div
      ref={rootRef}
      className={cn("relative mx-auto w-full max-w-5xl", className)}
    >
      <div className="absolute inset-x-4 -top-10 h-28 rounded-full bg-cyan-100/55 blur-3xl sm:inset-x-12 dark:bg-cyan-400/10" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/52 p-1.5 shadow-[0_42px_120px_rgba(31,43,71,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/7">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.52)_42%,transparent_58%)] opacity-55" />
        <div className="relative overflow-hidden rounded-[1.38rem] border border-slate-950/8 bg-[#fbfaf4] dark:border-white/8 dark:bg-[#080a10]">
          <div className="flex h-11 items-center justify-between gap-2 border-b border-slate-950/8 bg-white/42 px-3 backdrop-blur-xl sm:px-4 dark:border-white/8 dark:bg-white/[0.035]">
            <div className="flex shrink-0 items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="min-w-0 truncate rounded-full border border-slate-950/8 bg-white/76 px-2.5 py-1 text-[11px] text-slate-500 shadow-sm sm:px-3 sm:text-xs dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
              Visibl workspace
            </div>
            <div className="hidden shrink-0 text-xs font-medium text-slate-400 sm:block dark:text-slate-500">
              Live loop
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="border-b border-slate-950/8 bg-[#fbfaf4] p-4 sm:p-6 lg:border-r lg:border-b-0 lg:p-8 dark:border-white/8 dark:bg-[#080a10]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  {...(shouldAnimate ? { exit: { opacity: 0, y: -10 } } : {})}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-cyan-600 uppercase dark:text-cyan-300">
                    {scene.label}
                  </p>
                  <h3 className="mt-5 max-w-sm text-2xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">
                    {scene.title}
                  </h3>
                  <p className="mt-5 max-w-xs text-base leading-7 text-slate-600 dark:text-slate-300">
                    {scene.note}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 space-y-2">
                {scenes.map((item, itemIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    className="flex w-full items-center gap-3 rounded-lg py-1 text-left focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "h-px flex-1 bg-slate-200 dark:bg-white/12",
                        index === itemIndex && "bg-slate-950 dark:bg-white"
                      )}
                    />
                    <span
                      className={cn(
                        "w-16 text-right font-mono text-xs text-slate-400",
                        index === itemIndex && "text-slate-950 dark:text-white"
                      )}
                    >
                      0{itemIndex + 1}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="relative min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_82%_10%,rgba(103,232,249,0.22),transparent_28%),radial-gradient(circle_at_12%_86%,rgba(217,226,255,0.32),transparent_36%),linear-gradient(135deg,#fffdf8,#eef7f4)] p-4 sm:min-h-[480px] sm:p-6 lg:min-h-[560px] dark:bg-[radial-gradient(circle_at_82%_10%,rgba(103,232,249,0.13),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(96,165,250,0.11),transparent_32%),linear-gradient(135deg,#0b0d14,#10131d)]">
              <motion.div
                aria-hidden="true"
                {...(shouldAnimate
                  ? {
                      animate: {
                        x: ["-35%", "135%"],
                        opacity: [0, 0.82, 0],
                      },
                    }
                  : {})}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute top-0 left-0 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
              />
              <div className="absolute top-6 right-6 grid size-11 place-items-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_55px_rgba(34,211,238,0.42)]">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={
                    shouldAnimate ? { opacity: 0, y: 18, scale: 0.98 } : false
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  {...(shouldAnimate
                    ? { exit: { opacity: 0, y: -14, scale: 0.98 } }
                    : {})}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <Scene id={scene.id} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Scene({ id }: { id: SceneId }) {
  if (id === "chat") return <ChatScene />
  if (id === "pins") return <PinsScene />
  if (id === "artifact") return <ArtifactScene />
  return <ShareScene />
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[380px] max-w-xl flex-col overflow-hidden rounded-[1.35rem] border border-slate-950/8 bg-[#fffef9]/92 p-4 shadow-[0_28px_90px_rgba(25,34,58,0.12)] backdrop-blur-xl sm:min-h-[440px] sm:p-5 dark:border-cyan-300/16 dark:bg-[#101722]/92 dark:shadow-[0_28px_90px_rgba(0,0,0,0.38)]",
        className
      )}
    >
      {children}
    </div>
  )
}

function ChatScene() {
  const reduceMotion = useReducedMotion()
  const mounted = useMounted()
  const shouldAnimate = mounted && !reduceMotion

  return (
    <Surface>
      <Header icon={MessageSquareText} label="Conversation" />
      <div className="mt-10 space-y-4">
        <Bubble dark>
          We have interest, but the story changes every time someone asks for
          proof.
        </Bubble>
        <Bubble>Then we make the assumptions visible first.</Bubble>
        <Bubble dark>Can that become the page?</Bubble>
        <Bubble>Only after the useful parts are supported.</Bubble>
      </div>
      <div className="mt-auto flex gap-1.5 pt-8">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            {...(shouldAnimate
              ? {
                  animate: { y: [0, -4, 0] },
                  transition: {
                    duration: 0.8,
                    repeat: Infinity,
                    delay: dot * 0.12,
                  },
                }
              : {})}
            className="size-2 rounded-full bg-cyan-400"
          />
        ))}
      </div>
    </Surface>
  )
}

function PinsScene() {
  const reduceMotion = useReducedMotion()
  const mounted = useMounted()
  const shouldAnimate = mounted && !reduceMotion

  return (
    <Surface>
      <Header icon={Pin} label="Memory pins" />
      <div className="mt-10 space-y-4">
        {[
          ["ICP", "deadline-driven founders"],
          ["Risk", "generic AI substitution"],
          ["Trigger", "fundraising or accelerator deadline"],
          ["Proof gap", "need bottom-up market evidence"],
        ].map(([label, text], index) => (
          <motion.div
            key={label}
            initial={shouldAnimate ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: shouldAnimate ? index * 0.09 : 0 }}
            className="rounded-2xl border border-slate-950/8 bg-[#fbfaf4] p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-950 dark:text-white">
                {label}
              </p>
              <span className="rounded-full border border-slate-950/6 bg-white/80 px-2 py-1 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                pinned
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    </Surface>
  )
}

function ArtifactScene() {
  return (
    <Surface>
      <Header icon={FileText} label="Artifacts" />
      <div className="mt-9 grid gap-4">
        <DocLine title="Executive summary" status="ready" ready />
        <DocLine title="Investor FAQ" status="drafting from pins" />
        <DocLine title="Hosted page" status="waiting on proof gap" />
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#070b19] p-5 text-white shadow-[0_20px_60px_rgba(7,11,25,0.18)] dark:bg-white dark:text-slate-950">
        <p className="text-xs tracking-[0.18em] text-cyan-300 uppercase dark:text-cyan-700">
          Generated section
        </p>
        <p className="mt-4 text-2xl leading-tight font-semibold">
          Early founders need a workspace that separates company truth from
          pitch polish.
        </p>
      </div>
    </Surface>
  )
}

function ShareScene() {
  return (
    <Surface>
      <Header icon={MousePointer2} label="Hosted page" />
      <div className="mt-10 rounded-[1.2rem] border border-slate-950/8 bg-[#fbfaf4] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <p className="text-xs tracking-[0.18em] text-cyan-600 uppercase dark:text-cyan-300">
          Published
        </p>
        <h4 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          One link. Controlled truth.
        </h4>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Public story, gated proof, private workspace.
        </p>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-950/8 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
          <GitBranch className="size-4 text-cyan-500" />
          New feedback commit
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Advisor asked for stronger GTM evidence.
        </p>
      </div>
      <Button className="mt-auto h-11 rounded-full bg-slate-950 text-white shadow-[0_16px_42px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950">
        View page
        <ArrowRight className="size-4" />
      </Button>
    </Surface>
  )
}

function Header({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
        <Icon className="size-4" />
      </span>
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
        {label}
      </p>
    </div>
  )
}

function Bubble({
  children,
  dark,
}: {
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        "max-w-[88%] rounded-2xl p-4 text-sm leading-6 shadow-sm",
        dark
          ? "rounded-tl-sm border border-white/10 bg-[#070b19] text-white dark:bg-white dark:text-slate-950"
          : "ml-auto rounded-tr-sm border border-slate-950/8 bg-[#f7f9fb] text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300"
      )}
    >
      {children}
    </div>
  )
}

function DocLine({
  title,
  status,
  ready,
}: {
  title: string
  status: string
  ready?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-950/8 bg-[#fbfaf4] p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full",
          ready
            ? "bg-cyan-400 text-slate-950"
            : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
        )}
      >
        {ready ? <Check className="size-4" /> : <FileText className="size-4" />}
      </span>
      <div>
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{status}</p>
      </div>
    </div>
  )
}
