import Link from "next/link";
import { Zap, FileText, Sliders } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Three Input Modes",
    desc: "Paste notes, type a topic, or point at code. Inkforge normalises all three into a structured article.",
  },
  {
    icon: Sliders,
    title: "Fully Tunable",
    desc: "Independently control tone, format, and length. Beginner tutorial or senior architecture deep-dive — your call.",
  },
  {
    icon: Zap,
    title: "Dual Output",
    desc: "Articles land in your Inkforge library and mirror directly into your Anvilry portfolio's content folder.",
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg pointer-events-none" style={{ height: "600px" }} />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-6 pt-24 pb-20">
        <p className="mono-label hero-rise" style={{ animationDelay: "0.05s" }}>
          // ai article generation
        </p>

        <h1
          className="hero-rise mt-4 max-w-3xl text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] text-fg"
          style={{ animationDelay: "0.1s" }}
        >
          Turn your notes into{" "}
          <span className="text-accent" style={{ textShadow: "0 0 40px color-mix(in oklab, var(--accent) 40%, transparent)" }}>
            publishable
          </span>{" "}
          articles.
        </h1>

        <p
          className="hero-rise mt-6 max-w-2xl text-lg text-fg-muted leading-relaxed"
          style={{ animationDelay: "0.15s" }}
        >
          Paste notes, pick a topic, or point at code. Inkforge generates structured,
          human-readable MDX articles tuned for your voice — ready for your portfolio and
          external platforms.
        </p>

        <div className="hero-rise mt-10 flex items-center gap-4 flex-wrap" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg-base transition-colors hover:bg-accent-strong"
          >
            <Zap size={16} />
            Start Generating
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated"
          >
            View Articles
          </Link>
        </div>

        {/* Stat chips */}
        <div className="hero-rise mt-12 flex items-center gap-6 flex-wrap" style={{ animationDelay: "0.25s" }}>
          {[
            "STORM two-stage pipeline",
            "Bedrock + Anthropic fallback",
            "Dev.to · Hashnode publish",
          ].map((s) => (
            <span key={s} className="text-xs font-mono text-fg-subtle border border-border rounded-full px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 grid sm:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="scroll-reveal space-y-3"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <Icon size={18} className="text-accent" />
              </div>
              <p className="mono-label">{title}</p>
              <p className="text-sm text-fg-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
