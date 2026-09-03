"use client";

import { AlertTriangle, Save, Trash2, X, Loader2 } from "lucide-react";

interface UnsavedModalProps {
  isOpen: boolean;
  stepTitle?: string;
  onSaveAndContinue: () => Promise<void> | void;
  onDiscardAndContinue: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedModal({
  isOpen,
  stepTitle,
  onSaveAndContinue,
  onDiscardAndContinue,
  onCancel,
  isSaving = false,
}: UnsavedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              มีข้อมูลที่ยังไม่ได้บันทึก
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              คุณทำการแก้ไขเนื้อหาในขั้นตอน{" "}
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                &quot;{stepTitle || "ขั้นตอนปัจจุบัน"}&quot;
              </span>{" "}
              แต่ยังไม่ได้กดบันทึกข้อมูล คุณต้องการบันทึกการเปลี่ยนแปลงก่อนหรือไม่?
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            ยกเลิก (อยู่หน้านี้ต่อ)
          </button>

          <button
            type="button"
            onClick={onDiscardAndContinue}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>ไม่บันทึก</span>
          </button>

          <button
            type="button"
            onClick={onSaveAndContinue}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>บันทึกข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
