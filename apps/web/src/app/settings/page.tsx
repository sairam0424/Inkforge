"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui/StatusDot";

interface Config {
  llmProvider: string;
  llmConfigured: boolean;
  devtoConfigured: boolean;
  hashnodeConfigured: boolean;
  contentDir: string;
  contentDirExists: boolean;
  anvilryDir: string | null;
  anvilryDirExists: boolean;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border rounded-[14px] p-6 space-y-4">
      <p className="mono-label">{title}</p>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setConfig(d as Config))
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-10">
        <p className="mono-label mb-1">// configuration</p>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="mt-2 text-sm text-fg-muted">All settings are configured via environment variables.</p>
      </div>

      {!config ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[14px] bg-bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Card title="// llm provider">
            <StatusDot status={config.llmConfigured ? "ok" : "error"} label={config.llmConfigured ? `${config.llmProvider} — configured` : `${config.llmProvider} — not configured`} />
            <p className="text-xs text-fg-subtle font-mono">
              {config.llmProvider === "bedrock"
                ? "Set BEDROCK_ACCESS_KEY_ID + BEDROCK_SECRET_ACCESS_KEY"
                : "Set ANTHROPIC_API_KEY"}
              {" · "}Toggle with LLM_PROVIDER=bedrock|anthropic
            </p>
          </Card>

          <Card title="// output paths">
            <div className="space-y-2">
              <StatusDot status={config.contentDirExists ? "ok" : "error"} label={`Content: ${config.contentDir}`} />
              {config.anvilryDir ? (
                <StatusDot status={config.anvilryDirExists ? "ok" : "error"} label={`Anvilry mirror: ${config.anvilryDir}`} />
              ) : (
                <StatusDot status="unknown" label="Anvilry mirror: not configured" />
              )}
            </div>
            <p className="text-xs text-fg-subtle font-mono">
              INKFORGE_CONTENT_DIR · INKFORGE_ANVILRY_NOTES_DIR
            </p>
          </Card>

          <Card title="// publishing">
            <div className="space-y-2">
              <StatusDot status={config.devtoConfigured ? "ok" : "error"} label={`Dev.to — ${config.devtoConfigured ? "API key configured" : "DEVTO_API_KEY not set"}`} />
              <StatusDot status={config.hashnodeConfigured ? "ok" : "error"} label={`Hashnode — ${config.hashnodeConfigured ? "configured" : "HASHNODE_API_KEY or PUBLICATION_ID not set"}`} />
            </div>
            <p className="text-xs text-fg-subtle font-mono">
              DEVTO_API_KEY · HASHNODE_API_KEY · HASHNODE_PUBLICATION_ID
            </p>
          </Card>

          <Card title="// quick start">
            <p className="text-sm text-fg-muted">
              Ready to generate? Head to the{" "}
              <Link href="/generate" className="text-accent hover:text-accent-strong transition-colors">
                Generate page →
              </Link>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
