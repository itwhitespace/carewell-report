"use client";

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

  // Determine selected step
  const getInitialStep = () => {
    if (initialStepId) {
      const match = steps.find((s) => s.id === initialStepId);
      if (match) return match;
    }
    if (initialStepNumber && initialStepNumber >= 1 && initialStepNumber <= steps.length) {
      const match = steps.find((s) => s.step_number === initialStepNumber) ?? steps[initialStepNumber - 1];
      if (match) return match;
    }
    return steps.length > 0 ? steps[0] : null;
  };

  const selectedStep = getInitialStep();

  if (!selectedStep) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-8 text-center text-neutral-400">
        ยังไม่มีเนื้อหาในเรื่องนี้
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-16 md:px-24 lg:px-32">
        {/* Step Header: Title Only */}
        <div className="mb-8 pb-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {selectedStep.title}
          </h1>
        </div>

        {/* Pure Rendered Markdown Content */}
        <div className="prose-container">
          <MarkdownViewer content={selectedStep.content ?? ""} />
        </div>
      </div>
    </div>
  );
}
