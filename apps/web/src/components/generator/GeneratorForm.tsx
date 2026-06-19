"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { DialSelector } from "./DialSelector";
import { cn } from "@/lib/utils";
import type { GenerateCompleteEvent } from "./StreamingPreview";

const WORD_BUDGETS: Record<string, number> = {
  thread: 300,
  short: 800,
  medium: 1800,
  comprehensive: 3500,
};

const READ_TIME = (w: number) => Math.max(1, Math.round(w / 265));

const PLACEHOLDERS: Record<string, string> = {
  notes: "Paste your markdown notes, brain dump, or learning notes here...\n\n# My topic\n\n- Key insight 1\n- Key insight 2\n\n```typescript\n// relevant code\n```",
  topic: "e.g. How RAFT consensus algorithm works in distributed systems\n\nOr: The problem with React's useEffect and how to think about it correctly",
  code: "Paste your TypeScript/code here — Inkforge will extract the narrative and architecture story from it.\n\nexport function myFunction() { ... }",
};

interface GeneratorFormProps {
  onGenerateStart: () => void;
  onStageUpdate: (stage: string, detail?: string) => void;
  onTextChunk: (text: string) => void;
  onComplete: (r: GenerateCompleteEvent) => void;
  onError: (e: string) => void;
  isGenerating: boolean;
}

export function GeneratorForm({
  onGenerateStart,
  onStageUpdate,
  onTextChunk,
  onComplete,
  onError,
  isGenerating,
}: GeneratorFormProps) {
  const [inputType, setInputType] = useState<"notes" | "topic" | "code">("topic");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [tone, setTone] = useState("intermediate");
  const [format, setFormat] = useState("tutorial");
  const [length, setLength] = useState("medium");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const wordBudget = WORD_BUDGETS[length] ?? 1800;
  const readingTime = READ_TIME(wordBudget);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    if (!content.trim() || isGenerating) return;
    onGenerateStart();

    const request = {
      inputType,
      content,
      params: { tone, format, length, mode: "oneshot" },
      title: title.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      platforms: platforms.filter((p): p is "devto" | "hashnode" => ["devto", "hashnode"].includes(p)),
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.body) { onError("No response stream"); return; }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let previousStage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as {
              type: string;
              stage?: string;
              detail?: string;
              message?: string;
              slug?: string;
              wordCount?: number;
              readingTime?: number;
              primaryPath?: string;
              anvilryPath?: string;
            };

            if (ev.type === "progress") {
              const stage = ev.stage ?? "";
              if (stage !== previousStage) {
                onStageUpdate(stage, ev.detail);
                previousStage = stage;
              }
              if (stage === "draft" && ev.detail) {
                accumulated += `\n\n## ${ev.detail.replace(/^\d+\/\d+ — /, "")}\n\n[Drafting…]`;
                onTextChunk(accumulated);
              } else if (stage === "polish") {
                onTextChunk("✦ Polishing article…\n\n" + accumulated);
              }
            } else if (ev.type === "complete") {
              onComplete(ev as GenerateCompleteEvent);
            } else if (ev.type === "error") {
              onError(ev.message ?? "Unknown error");
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      onError(String(err));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg-surface p-6 space-y-5">
      {/* Input mode selector */}
      <DialSelector
        label="Input Mode"
        layoutId="input-mode"
        options={[
          { value: "topic", label: "Topic" },
          { value: "notes", label: "Notes" },
          { value: "code",  label: "Code" },
        ]}
        value={inputType}
        onChange={(v) => setInputType(v as typeof inputType)}
      />

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={PLACEHOLDERS[inputType]}
        disabled={isGenerating}
        rows={9}
        className={cn(
          "w-full rounded-lg border border-border bg-bg-elevated p-4",
          "font-mono text-sm text-fg placeholder:text-fg-subtle leading-relaxed",
          "resize-y focus:border-accent/50 focus:outline-none transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      />

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg-muted transition-colors self-start font-mono"
      >
        {showAdvanced ? "▼" : "▶"} Advanced options
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-lg border border-border bg-bg-elevated/40 p-4">
          <div>
            <label className="mono-label block mb-1.5">Title Override</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="mono-label block mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="typescript, react, distributed-systems"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-mono text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Generation dials */}
      <div className="space-y-4 border-t border-border pt-5">
        <DialSelector
          label="Tone"
          layoutId="tone"
          options={[
            { value: "beginner",     label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "senior",       label: "Senior" },
          ]}
          value={tone}
          onChange={setTone}
        />
        <DialSelector
          label="Format"
          layoutId="format"
          options={[
            { value: "tutorial",  label: "Tutorial" },
            { value: "narrative", label: "Narrative" },
            { value: "explainer", label: "Explainer" },
            { value: "opinion",   label: "Opinion" },
            { value: "showcase",  label: "Showcase" },
          ]}
          value={format}
          onChange={setFormat}
        />
        <DialSelector
          label="Length"
          layoutId="length"
          options={[
            { value: "thread",        label: "Thread" },
            { value: "short",         label: "Short" },
            { value: "medium",        label: "Medium" },
            { value: "comprehensive", label: "Comprehensive" },
          ]}
          value={length}
          onChange={setLength}
        />
      </div>

      {/* Platform targets */}
      <div className="space-y-1.5">
        <p className="mono-label">Publish To</p>
        <div className="flex gap-5">
          {[
            { id: "devto", label: "Dev.to" },
            { id: "hashnode", label: "Hashnode" },
          ].map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={platforms.includes(id)}
                onChange={() => togglePlatform(id)}
                className="accent-accent h-4 w-4"
              />
              <span className="text-sm font-mono text-fg-muted">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="border-t border-border pt-5 space-y-2.5">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!content.trim() || isGenerating}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg py-3.5 font-semibold text-sm transition-all",
            "bg-accent text-bg-base hover:bg-accent-strong",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent",
          )}
        >
          {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          {isGenerating ? "Generating…" : "⚡ Generate Article"}
        </button>
        <p className="text-center text-xs text-fg-subtle font-mono">
          ~{wordBudget.toLocaleString()} words &middot; {readingTime} min read
        </p>
      </div>
    </div>
  );
}
