"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold text-fg">Something went wrong</h1>
      <pre className="max-w-lg w-full rounded-lg bg-bg-elevated border border-border p-4 font-mono text-sm text-fg-muted text-left overflow-auto">
        {error.message}
      </pre>
      <button
        onClick={reset}
        className="rounded-lg bg-accent text-bg-base px-5 py-2.5 text-sm font-semibold hover:bg-accent-strong transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
