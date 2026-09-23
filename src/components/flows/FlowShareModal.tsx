"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, X, Share2, ShieldCheck } from "lucide-react";

export function FlowShareModal({
  isOpen,
  onClose,
  flowId,
  flowTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  flowId: string;
  flowTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/flows/${flowId}/view`);
    }
  }, [flowId]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                แชร์ลิงก์เปิดอ่าน (Share Flow)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {flowTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security / View-Only Badge */}
        <div className="my-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <span className="font-semibold">โหมดเปิดอ่านเท่านั้น (Read-Only View):</span> ผู้ที่ได้รับลิงก์จะสามารถเปิดอ่านขั้นตอนและดูสื่อประกอบได้ แต่จะ<strong>ไม่เห็นแถบเมนูจัดการ</strong> และ<strong>ไม่สามารถแก้ไขเนื้อหาได้</strong>
            </div>
          </div>
        </div>

        {/* Link Input & Copy Button */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            ลิงก์สำหรับแชร์ (Public View URL)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 font-mono text-xs text-neutral-800 selection:bg-blue-200 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition-all ${
                copied
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>ทดสอบเปิดดูหน้าผู้อ่าน (เปิดในแท็บใหม่)</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
