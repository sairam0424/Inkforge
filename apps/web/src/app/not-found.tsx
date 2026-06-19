import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <p className="text-[8rem] font-mono font-bold leading-none" style={{ color: "color-mix(in oklab, var(--accent) 20%, transparent)" }}>
        404
      </p>
      <h1 className="text-2xl font-semibold text-fg">Page not found</h1>
      <p className="text-fg-muted max-w-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-4 text-accent hover:text-accent-strong transition-colors text-sm font-medium">
        ← Back to Inkforge
      </Link>
    </div>
  );
}
