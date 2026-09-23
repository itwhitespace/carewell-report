"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarkdownViewer } from "@/components/flows/MarkdownViewer";
import type { SystemFlow, FlowStep } from "@/lib/flows";

export function FlowViewClient({
  initialFlow,
  initialStepNumber,
  initialStepId,
}: {
  initialFlow: SystemFlow;
  initialStepNumber?: number;
  initialStepId?: string;
}) {
  const steps: FlowStep[] = initialFlow.steps ?? [];

  // Determine initial selected step
  const getInitialStepId = () => {
    if (initialStepId) {
      const match = steps.find((s) => s.id === initialStepId);
      if (match) return match.id;
    }
    if (initialStepNumber && initialStepNumber >= 1 && initialStepNumber <= steps.length) {
      const match = steps.find((s) => s.step_number === initialStepNumber) ?? steps[initialStepNumber - 1];
      if (match) return match.id;
    }
    return steps.length > 0 ? steps[0].id : null;
  };

  const [selectedStepId, setSelectedStepId] = useState<string | null>(getInitialStepId);

  const currentIndex = steps.findIndex((s) => s.id === selectedStepId);
  const selectedStep = currentIndex !== -1 ? steps[currentIndex] : steps[0] ?? null;

  // Sync with browser URL history when step changes
  const handleSelectStep = (step: FlowStep) => {
    setSelectedStepId(step.id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(step.step_number));
      window.history.replaceState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      handleSelectStep(steps[currentIndex - 1]);
    }
  };

  const handleNextStep = () => {
    if (currentIndex < steps.length - 1) {
      handleSelectStep(steps[currentIndex + 1]);
    }
  };

  if (!selectedStep) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-8 text-center text-neutral-400">
        ยังไม่มีเนื้อหาในขั้นตอนนี้
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-[1905px] px-6 py-8 sm:px-12 sm:py-10">
        {/* Step Header: Step Number, Title, Prev/Next Minimal Buttons */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 pb-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              ขั้นตอนที่ {currentIndex + 1} จาก {steps.length}
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {selectedStep.title}
            </h1>
          </div>

          {/* Minimal Navigation Buttons */}
          {steps.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStep}
                disabled={currentIndex <= 0}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>ก่อนหน้า</span>
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentIndex >= steps.length - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>ถัดไป</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Pure Rendered Markdown Content */}
        <div className="prose-container">
          <MarkdownViewer content={selectedStep.content ?? ""} />
        </div>
      </div>
    </div>
  );
}
