"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArticleCard, type ArticleMeta } from "@/components/articles/ArticleCard";
import { ArticleSkeletons } from "@/components/articles/ArticleSkeletons";
import { cn } from "@/lib/utils";

const FORMATS = ["all", "tutorial", "narrative", "explainer", "opinion", "showcase"] as const;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => { setArticles(data as ArticleMeta[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? articles
    : articles.filter((a) => a.format === filter);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="mono-label mb-1">// your writing</p>
          <h1 className="text-3xl font-semibold tracking-tight text-fg">
            Articles
            {!loading && articles.length > 0 && (
              <span className="ml-3 text-xl font-mono text-accent">{articles.length}</span>
            )}
          </h1>
        </div>
        <Link
          href="/generate"
          className="rounded-lg bg-accent text-bg-base px-4 py-2 text-sm font-semibold hover:bg-accent-strong transition-colors"
        >
          + New Article
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors whitespace-nowrap",
              filter === f
                ? "bg-accent text-bg-base"
                : "text-fg-muted hover:text-fg hover:bg-bg-elevated border border-border",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleSkeletons count={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-5xl font-mono text-fg-subtle/20">∅</span>
          <p className="text-fg-muted text-sm">
            {filter === "all" ? "No articles yet." : `No ${filter} articles.`}
          </p>
          <Link href="/generate" className="text-accent hover:text-accent-strong text-sm font-medium transition-colors">
            Generate your first article →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => <ArticleCard key={a.slug} article={a} />)}
        </div>
      )}
    </div>
  );
}
