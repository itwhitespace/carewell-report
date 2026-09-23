"use client";

import { useState } from "react";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { MarkdownViewer } from "@/components/flows/MarkdownViewer";
import type { SystemFlow, FlowStep } from "@/lib/flows";

export function FlowViewClient({ initialFlow }: { initialFlow: SystemFlow }) {
  const [steps] = useState<FlowStep[]>(initialFlow.steps ?? []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialFlow.steps && initialFlow.steps.length > 0 ? initialFlow.steps[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const currentIndex = steps.findIndex((s) => s.id === selectedStepId);
  const selectedStep =
    currentIndex !== -1 ? steps[currentIndex] : steps[0] ?? null;

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      setSelectedStepId(steps[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStep = () => {
    if (currentIndex < steps.length - 1) {
      setSelectedStepId(steps[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Top Header Bar for View-Only Mode */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90 shadow-sm">
        <div className="mx-auto flex max-w-[1905px] items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  คู่มือขั้นตอนระบบ (System Flow Reader)
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {steps.length} ขั้นตอน
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {initialFlow.title}
              </h1>
            </div>
          </div>

          {/* Quick Copy Link Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              }`}
              title="คัดลอกลิงก์หน้านี้"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="hidden sm:inline">แชร์หน้านี้</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1905px] px-4 sm:px-6 py-6">
        {/* Flow Description banner if present */}
        {initialFlow.description && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {initialFlow.description}
            </p>
          </div>
        )}

        {/* Mobile Steps Carousel / Selector */}
        <div className="mb-6 flex xl:hidden overflow-x-auto pb-2 gap-2 scrollbar-thin">
          {steps.map((step, idx) => {
            const isSelected = step.id === selectedStep?.id;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setSelectedStepId(step.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-neutral-100 dark:bg-neutral-800"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="max-w-[160px] truncate">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Layout: Sidebar + Reader */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Left Steps Navigation (Desktop) */}
          <div className="hidden xl:block xl:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 pb-3 font-bold text-sm text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800">
                <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>ขั้นตอนทั้งหมด ({steps.length})</span>
              </div>

              <div className="mt-3 space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                {steps.map((step, idx) => {
                  const isSelected = step.id === selectedStep?.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setSelectedStepId(step.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl p-3 text-left text-xs transition-colors border ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/80 font-semibold text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 shadow-xs"
                          : "border-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
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
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Reader View */}
          <div className="xl:col-span-4">
            {selectedStep ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Step Title Header */}
                <div className="mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      <span>ขั้นตอนที่ {currentIndex + 1} จาก {steps.length}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {selectedStep.title}
                    </h2>
                  </div>

                  {/* Top Prev / Next Navigation buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevStep}
                      disabled={currentIndex <= 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>ก่อนหน้า</span>
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={currentIndex >= steps.length - 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Markdown Viewer */}
                <div className="min-h-[400px]">
                  <MarkdownViewer content={selectedStep.content ?? ""} />
                </div>

                {/* Bottom Navigation Step Bar */}
                <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentIndex <= 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>ขั้นตอนก่อนหน้า</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>CareWell System Documentation</span>
                  </div>

                  <button
                    onClick={handleNextStep}
                    disabled={currentIndex >= steps.length - 1}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none shadow-sm transition-all"
                  >
                    <span>ขั้นตอนถัดไป</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-400 dark:border-neutral-800">
                ยังไม่มีข้อมูลขั้นตอนสำหรับ Flow นี้
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
