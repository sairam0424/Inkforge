"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface DialOption {
  value: string;
  label: string;
}

interface DialSelectorProps {
  label: string;
  options: DialOption[];
  value: string;
  onChange: (v: string) => void;
  layoutId: string;
}

export function DialSelector({ label, options, value, onChange, layoutId }: DialSelectorProps) {
  return (
    <div className="space-y-1.5">
      <p className="mono-label">{label}</p>
      <div className="relative flex rounded-full border border-border bg-bg-surface/50 p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors no-focus-ring",
              value === opt.value ? "text-bg-base" : "text-fg-muted hover:text-fg",
            )}
          >
            {value === opt.value && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 z-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
