import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "accent" | "violet" | "green" | "amber" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated text-fg-subtle",
  accent:  "bg-accent/15 text-accent",
  violet:  "bg-violet/15 text-violet",
  green:   "bg-green/15 text-green",
  amber:   "bg-amber/15 text-amber",
  muted:   "bg-bg-surface text-fg-subtle border border-border",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
