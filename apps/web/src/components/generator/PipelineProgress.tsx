"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "ingest",  label: "Ingesting input" },
  { id: "outline", label: "Generating outline" },
  { id: "draft",   label: "Drafting sections" },
  { id: "polish",  label: "Polishing" },
  { id: "emit",    label: "Writing files" },
];

interface PipelineProgressProps {
  activeStage: string | null;
  stageDetail?: string;
  completedStages: string[];
}

export function PipelineProgress({ activeStage, stageDetail, completedStages }: PipelineProgressProps) {
  if (!activeStage && completedStages.length === 0) return null;

  return (
    <div className="space-y-0.5 py-2">
      <AnimatePresence>
        {STAGES.map((stage) => {
          const isDone   = completedStages.includes(stage.id);
          const isActive = activeStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5 py-1"
            >
              {isDone ? (
                <CheckCircle2 size={13} className="shrink-0 text-green" />
              ) : isActive ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-accent" />
              ) : (
                <Circle size={13} className="shrink-0 text-fg-subtle" />
              )}
              <span className={cn("text-xs", isActive ? "text-fg" : isDone ? "text-fg-muted" : "text-fg-subtle")}>
                {stage.label}
              </span>
              {isActive && stageDetail && (
                <span className="ml-auto text-[11px] text-fg-subtle truncate max-w-[130px]">{stageDetail}</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
