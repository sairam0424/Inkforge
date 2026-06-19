"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export interface ArticleMeta {
  slug: string;
  title: string;
  summary?: string;
  date: string;
  tags?: string[];
  tone?: string;
  format?: string;
  wordCount?: number;
  readingTime?: number;
  platforms?: string[];
}

type BadgeVariant = "green" | "amber" | "violet";
const toneVariant = (t?: string): BadgeVariant =>
  t === "beginner" ? "green" : t === "senior" ? "amber" : "violet";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  const date = new Date(article.date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Link href={`/articles/${article.slug}`} className="card-surface block p-5 space-y-3 group">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {article.format && <Badge variant="accent">{article.format}</Badge>}
        {article.tone && <Badge variant={toneVariant(article.tone)}>{article.tone}</Badge>}
      </div>

      {/* Title */}
      <h2 className="text-fg font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
        {article.title}
      </h2>

      {/* Summary */}
      {article.summary && (
        <p className="text-fg-muted text-sm line-clamp-2 leading-relaxed">{article.summary}</p>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="muted">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-fg-subtle pt-0.5">
        <span>{date}</span>
        <span className="flex items-center gap-2">
          {article.wordCount && <span>{article.wordCount.toLocaleString()}w</span>}
          {article.readingTime && <span>&middot; {article.readingTime} min</span>}
          {article.platforms?.includes("devto") && (
            <span className="h-2 w-2 rounded-full bg-green" title="Published on Dev.to" />
          )}
          {article.platforms?.includes("hashnode") && (
            <span className="h-2 w-2 rounded-full bg-violet" title="Published on Hashnode" />
          )}
        </span>
      </div>
    </Link>
  );
}
