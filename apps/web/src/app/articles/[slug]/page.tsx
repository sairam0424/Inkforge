"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ArticleDetail {
  slug: string;
  title: string;
  summary?: string;
  date: string;
  tags: string[];
  tone?: string;
  format?: string;
  length?: string;
  wordCount?: number;
  readingTime?: number;
  platforms?: string[];
  body: string;
}

function parseMeta(content: string): ArticleDetail {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, unknown> = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const ci = line.indexOf(":");
      if (ci < 0) continue;
      const k = line.slice(0, ci).trim();
      const v = line.slice(ci + 1).trim().replace(/^"(.*)"$/, "$1");
      if (v.startsWith("[")) {
        meta[k] = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
      } else {
        meta[k] = !isNaN(Number(v)) && v !== "" ? Number(v) : v === "true" ? true : v === "false" ? false : v;
      }
    }
  }
  return {
    slug: String(meta.slug ?? ""),
    title: String(meta.title ?? "Untitled"),
    summary: meta.summary ? String(meta.summary) : undefined,
    date: String(meta.date ?? ""),
    tags: Array.isArray(meta.tags) ? meta.tags as string[] : [],
    tone: meta.tone ? String(meta.tone) : undefined,
    format: meta.format ? String(meta.format) : undefined,
    length: meta.length ? String(meta.length) : undefined,
    wordCount: typeof meta.wordCount === "number" ? meta.wordCount : undefined,
    readingTime: typeof meta.readingTime === "number" ? meta.readingTime : undefined,
    platforms: Array.isArray(meta.platforms) ? meta.platforms as string[] : [],
    body: content.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
  };
}

type BadgeVariant = "green" | "amber" | "violet";
const toneColor = (t?: string): BadgeVariant =>
  t === "beginner" ? "green" : t === "senior" ? "amber" : "violet";

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then((r) => r.json())
      .then((d: { content?: string }) => {
        if (d.content) setArticle(parseMeta(d.content));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const publishTo = async (platform: string) => {
    setPublishing(platform);
    try {
      const r = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, platform }),
      });
      const d = await r.json() as { url?: string; error?: string };
      if (d.url) setPublishResults((p) => ({ ...p, [platform]: d.url! }));
    } finally {
      setPublishing(null);
    }
  };

  const copyMDX = () => {
    if (!article) return;
    navigator.clipboard.writeText(article.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 animate-pulse space-y-4">
        <div className="h-4 w-20 bg-bg-elevated rounded" />
        <div className="h-8 w-2/3 bg-bg-elevated rounded" />
        <div className="h-4 w-full bg-bg-elevated rounded" />
        <div className="h-4 w-3/4 bg-bg-elevated rounded" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-fg-muted">Article not found.</p>
        <Link href="/articles" className="text-accent hover:text-accent-strong text-sm mt-4 inline-block">← All Articles</Link>
      </div>
    );
  }

  const date = new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-8 transition-colors">
        <ArrowLeft size={14} /> All Articles
      </Link>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Article */}
        <article className="flex-1 min-w-0">
          <header className="mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {article.format && <Badge variant="accent">{article.format}</Badge>}
              {article.tone && <Badge variant={toneColor(article.tone)}>{article.tone}</Badge>}
              {article.length && <Badge variant="muted">{article.length}</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-3">{article.title}</h1>
            {article.summary && <p className="text-fg-muted leading-relaxed mb-3">{article.summary}</p>}
            <p className="text-xs font-mono text-fg-subtle">{date}</p>
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {article.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
              </div>
            )}
          </header>

          <div className="bg-bg-surface border border-border rounded-[14px] p-6 font-mono text-sm text-fg-muted leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-[70vh]">
            {article.body}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0 space-y-4">
          <div className="card-surface p-4 space-y-3">
            <p className="mono-label">Stats</p>
            {article.wordCount && (
              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">Words</span>
                <span className="font-mono text-fg">{article.wordCount.toLocaleString()}</span>
              </div>
            )}
            {article.readingTime && (
              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">Read time</span>
                <span className="font-mono text-fg">{article.readingTime} min</span>
              </div>
            )}
          </div>

          <div className="card-surface p-4 space-y-2">
            <p className="mono-label mb-3">Actions</p>
            <button
              type="button"
              onClick={copyMDX}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-bg-elevated transition-colors"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy MDX"}
            </button>
            {!article.platforms?.includes("devto") && (
              <button
                type="button"
                onClick={() => publishTo("devto")}
                disabled={!!publishing}
                className="w-full flex items-center gap-2 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green hover:bg-green/20 transition-colors disabled:opacity-50"
              >
                <ExternalLink size={13} />
                {publishing === "devto" ? "Publishing…" : publishResults.devto ? "Published ✓" : "Publish to Dev.to"}
              </button>
            )}
            {!article.platforms?.includes("hashnode") && (
              <button
                type="button"
                onClick={() => publishTo("hashnode")}
                disabled={!!publishing}
                className="w-full flex items-center gap-2 rounded-lg border border-violet/30 bg-violet/10 px-3 py-2 text-sm text-violet hover:bg-violet/20 transition-colors disabled:opacity-50"
              >
                <ExternalLink size={13} />
                {publishing === "hashnode" ? "Publishing…" : publishResults.hashnode ? "Published ✓" : "Publish to Hashnode"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
