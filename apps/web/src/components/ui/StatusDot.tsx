import { cn } from "@/lib/utils";

type DotStatus = "ok" | "error" | "unknown";

const dotClasses: Record<DotStatus, string> = {
  ok:      "bg-green",
  error:   "bg-red",
  unknown: "bg-fg-subtle",
};

interface StatusDotProps {
  status: DotStatus;
  label: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClasses[status])} />
      <span className="text-sm text-fg-muted">{label}</span>
    </span>
  );
}
