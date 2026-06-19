"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { CheckCircle2, ArrowRight, Copy } from "lucide-react";
import { PipelineProgress } from "./PipelineProgress";
import { cn } from "@/lib/utils";

export interface GenerateCompleteEvent {
  type: "complete";
  slug: string;
  wordCount: number;
  readingTime: number;
  primaryPath: string;
  anvilryPath?: string;
}

interface StreamingPreviewProps {
  isGenerating: boolean;
  activeStage: string | null;
  stageDetail?: string;
  completedStages: string[];
  streamedText: string;
  isComplete: boolean;
  result?: GenerateCompleteEvent;
  error?: string;
}

export function StreamingPreview({
  isGenerating,
  activeStage,
  stageDetail,
  completedStages,
  streamedText,
  isComplete,
  result,
  error,
}: StreamingPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isIdle = !isGenerating && !isComplete && !error;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedText]);

  return (
    <div className="flex flex-col h-full min-h-[500px] border-l border-border bg-bg-surface/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <p className="mono-label">// live preview</p>
        {(isGenerating || isComplete) && (
          <span
            className={cn(
              "text-xs font-mono px-2 py-0.5 rounded-full border",
              isComplete
                ? "text-green border-green/30 bg-green/10"
                : "text-accent border-accent/30 bg-accent/10",
            )}
          >
            {isComplete ? "✓ complete" : `✦ ${activeStage ?? "generating"}`}
          </span>
        )}
      </div>

      {/* Content area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
        {isIdle && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-5 py-16">
            <div
              className="orb-idle w-20 h-20 rounded-full border border-accent/20"
              style={{ background: "radial-gradient(circle at 40% 40%, color-mix(in oklab, var(--accent) 15%, transparent), color-mix(in oklab, var(--violet) 10%, transparent))" }}
            />
            <p className="text-fg-subtle text-sm max-w-xs leading-relaxed">
              Your article will appear here as it generates in real time.
            </p>
            <p className="text-fg-subtle/50 text-xs font-mono">← fill the form and hit Generate</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red/30 bg-red/10 p-4">
            <p className="text-sm font-mono text-red mb-2">Generation failed</p>
            <p className="text-xs text-fg-muted">{error}</p>
          </div>
        )}

        {(isGenerating || isComplete) && (
          <div className="font-mono text-sm text-fg-muted leading-relaxed whitespace-pre-wrap break-words">
            {streamedText}
            {isGenerating && <span className="terminal-cursor" aria-hidden />}
          </div>
        )}

        {isGenerating && !streamedText && (
          <div className="space-y-3 pt-4">
            {[80, 100, 65, 90, 70, 55, 95].map((w, i) => (
              <div key={i} className="h-3 rounded bg-bg-elevated animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Pipeline progress */}
      {(isGenerating || isComplete) && (
        <div className="px-6 pb-2 border-t border-border shrink-0">
          <PipelineProgress
            activeStage={activeStage}
            stageDetail={stageDetail}
            completedStages={completedStages}
          />
        </div>
      )}

      {/* Complete actions */}
      {isComplete && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-t border-border bg-bg-elevated/50 shrink-0"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <CheckCircle2 size={15} className="text-green" />
            <span className="text-sm text-fg font-medium">
              {result.wordCount.toLocaleString()} words &middot; {result.readingTime} min read
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href={`/articles/${result.slug}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent text-bg-base text-sm font-semibold py-2.5 hover:bg-accent-strong transition-colors"
            >
              View Article <ArrowRight size={14} />
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.slug)}
              title="Copy slug"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-mono text-fg-muted hover:text-fg hover:bg-bg-elevated transition-colors"
            >
              <Copy size={13} />
              {result.slug}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
