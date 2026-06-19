"use client";

import { useState } from "react";
import { GeneratorForm } from "@/components/generator/GeneratorForm";
import { StreamingPreview, type GenerateCompleteEvent } from "@/components/generator/StreamingPreview";

export default function GeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [stageDetail, setStageDetail] = useState<string | undefined>(undefined);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [streamedText, setStreamedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<GenerateCompleteEvent | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleGenerateStart = () => {
    setIsGenerating(true);
    setActiveStage("ingest");
    setCompletedStages([]);
    setStreamedText("");
    setIsComplete(false);
    setResult(undefined);
    setError(undefined);
  };

  const handleStageUpdate = (stage: string, detail?: string) => {
    setCompletedStages((prev) => {
      if (activeStage && !prev.includes(activeStage)) return [...prev, activeStage];
      return prev;
    });
    setActiveStage(stage);
    setStageDetail(detail);
  };

  const handleComplete = (r: GenerateCompleteEvent) => {
    setCompletedStages(["ingest", "outline", "draft", "polish", "emit"]);
    setActiveStage(null);
    setIsGenerating(false);
    setIsComplete(true);
    setResult(r);
  };

  const handleError = (e: string) => {
    setIsGenerating(false);
    setActiveStage(null);
    setError(e);
  };

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="w-full lg:w-1/2 overflow-y-auto">
        <GeneratorForm
          onGenerateStart={handleGenerateStart}
          onStageUpdate={handleStageUpdate}
          onTextChunk={setStreamedText}
          onComplete={handleComplete}
          onError={handleError}
          isGenerating={isGenerating}
        />
      </div>
      <div className="w-full lg:w-1/2 flex flex-col">
        <StreamingPreview
          isGenerating={isGenerating}
          activeStage={activeStage}
          stageDetail={stageDetail}
          completedStages={completedStages}
          streamedText={streamedText}
          isComplete={isComplete}
          result={result}
          error={error}
        />
      </div>
    </div>
  );
}
