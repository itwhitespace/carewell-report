"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Layers } from "lucide-react";
import type { FlowStep } from "@/lib/flows";

export function FlowStepSidebar({
  steps,
  selectedStepId,
  onSelectStep,
  onCreateStep,
  onDeleteStep,
  onReorderSteps,
}: {
  steps: FlowStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onCreateStep: (title: string) => Promise<void>;
  onDeleteStep: (stepId: string) => Promise<void>;
  onReorderSteps: (stepIds: string[]) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      await onCreateStep(newTitle.trim());
      setNewTitle("");
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const newSteps = [...steps];
    const [moved] = newSteps.splice(index, 1);
    newSteps.splice(targetIndex, 0, moved);

    await onReorderSteps(newSteps.map((s) => s.id));
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 font-bold text-sm text-neutral-900 dark:text-neutral-100">
          <Layers className="h-4 w-4 text-blue-500" />
          <span>ขั้นตอนทั้งหมด ({steps.length})</span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>เพิ่มขั้นตอน</span>
        </button>
      </div>

      {/* Add step form */}
      {isAdding && (
        <form onSubmit={handleAddStep} className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="เช่น ขั้นตอนที่ 2: ตรวจสอบข้อมูล"
            autoFocus
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่ม"}
            </button>
          </div>
        </form>
      )}

      {/* Steps list */}
      <div className="mt-3 space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
        {steps.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-400">ยังไม่มีขั้นตอน ย้อนกลับเพื่อเพิ่ม</p>
        ) : (
          steps.map((step, idx) => {
            const isSelected = step.id === selectedStepId;
            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`group relative flex items-center justify-between gap-2 rounded-xl p-3 text-xs cursor-pointer transition-colors border ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/80 font-semibold text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>

                {/* Actions: Move Up / Down, Delete */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, "up");
                      }}
                      title="เลื่อนขึ้น"
                      className="p-1 hover:text-blue-600 rounded"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {idx < steps.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(idx, "down");
                      }}
                      title="เลื่อนลง"
                      className="p-1 hover:text-blue-600 rounded"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {steps.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`คุณต้องการลบขั้นตอน "${step.title}" ใช่หรือไม่?`)) {
                          onDeleteStep(step.id);
                        }
                      }}
                      title="ลบขั้นตอน"
                      className="p-1 text-red-500 hover:text-red-700 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
