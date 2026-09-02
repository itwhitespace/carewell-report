"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit2, Save, Trash2, Check, ExternalLink } from "lucide-react";
import { FlowStepSidebar } from "@/components/flows/FlowStepSidebar";
import { FlowEditor } from "@/components/flows/FlowEditor";
import {
  createStepAction,
  deleteStepAction,
  reorderStepsAction,
  updateFlowAction,
  updateStepAction,
} from "../actions";
import type { SystemFlow, FlowStep } from "@/lib/flows";

export function FlowDetailClient({ initialFlow }: { initialFlow: SystemFlow }) {
  const [flow, setFlow] = useState<SystemFlow>(initialFlow);
  const [steps, setSteps] = useState<FlowStep[]>(initialFlow.steps ?? []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialFlow.steps && initialFlow.steps.length > 0 ? initialFlow.steps[0].id : null
  );

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [flowTitle, setFlowTitle] = useState(flow.title);
  const [flowDesc, setFlowDesc] = useState(flow.description ?? "");
  const [flowCat, setFlowCat] = useState(flow.category ?? "General");

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? steps[0] ?? null;

  async function handleSaveHeader(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", flowTitle);
    formData.append("description", flowDesc);
    formData.append("category", flowCat);
    await updateFlowAction(flow.id, formData);
    setFlow((prev) => ({
      ...prev,
      title: flowTitle,
      description: flowDesc,
      category: flowCat,
    }));
    setIsEditingHeader(false);
  }

  async function handleSaveStep(stepId: string, title: string, content: string) {
    await updateStepAction(stepId, { title, content });
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, title, content } : s))
    );
  }

  async function handleCreateStep(title: string) {
    const formData = new FormData();
    formData.append("title", title);
    const newStep = await createStepAction(flow.id, formData);
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }

  async function handleDeleteStep(stepId: string) {
    await deleteStepAction(stepId, flow.id);
    const updated = steps.filter((s) => s.id !== stepId);
    setSteps(updated);
    if (selectedStepId === stepId) {
      setSelectedStepId(updated.length > 0 ? updated[0].id : null);
    }
  }

  async function handleReorderSteps(stepIds: string[]) {
    await reorderStepsAction(flow.id, stepIds);
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const reordered = stepIds.map((id, idx) => ({
      ...stepMap.get(id)!,
      step_number: idx + 1,
    }));
    setSteps(reordered);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Top navigation link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/flows"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับไปหน้าขั้นตอนทั้งหมด</span>
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {isEditingHeader ? (
          <form onSubmit={handleSaveHeader} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">ชื่อ Flow</label>
              <input
                type="text"
                value={flowTitle}
                onChange={(e) => setFlowTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-lg font-bold text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-neutral-500 mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  value={flowDesc}
                  onChange={(e) => setFlowDesc(e.target.value)}
                  placeholder="คำอธิบายสั้นๆ..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">หมวดหมู่</label>
                <select
                  value={flowCat}
                  onChange={(e) => setFlowCat(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  <option value="General">General</option>
                  <option value="Import">Import/Export</option>
                  <option value="Database">Database</option>
                  <option value="API">API/Backend</option>
                  <option value="UI/UX">UI/UX Layout</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditingHeader(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>บันทึกส่วนหัว</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {flow.category ?? "General"}
                </span>
                <span className="text-xs text-neutral-400">
                  {steps.length} ขั้นตอน
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {flow.title}
              </h1>

              {flow.description && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {flow.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setIsEditingHeader(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>แก้ไขหัวข้อ Flow</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Layout: Steps Sidebar + Main Editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <FlowStepSidebar
            steps={steps}
            selectedStepId={selectedStep?.id ?? null}
            onSelectStep={(id) => setSelectedStepId(id)}
            onCreateStep={handleCreateStep}
            onDeleteStep={handleDeleteStep}
            onReorderSteps={handleReorderSteps}
          />
        </div>

        {/* Right Main Editor */}
        <div className="lg:col-span-3">
          {selectedStep ? (
            <FlowEditor step={selectedStep} onSaveStep={handleSaveStep} />
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-400 dark:border-neutral-800">
              ยังไม่มีขั้นตอนที่เลือก — กรุณากด &quot;เพิ่มขั้นตอน&quot; ทางด้านซ้าย
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
