"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DollarSign,
  HelpCircle,
  AlertCircle,
  Check,
  UserCheck,
} from "lucide-react";
import { updateServiceRecipient } from "../../actions";
import {
  formatCurrency,
  parseNumberInput,
  type ServiceRecipientRow,
} from "../../ServiceRecipientsClient";

export function EditServiceRecipientClient({
  row,
}: {
  row: ServiceRecipientRow;
}) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [jobCode, setJobCode] = useState(row.job_code ?? "");
  const [serviceDate, setServiceDate] = useState(row.service_date ?? "");
  const [careLevel, setCareLevel] = useState(row.care_level ?? "");
  const [workFormat, setWorkFormat] = useState(row.work_format ?? "");
  const [status, setStatus] = useState(row.status ?? "");

  // Payment Form State
  const [netTotalStr, setNetTotalStr] = useState(
    row.net_total ? row.net_total.toLocaleString("th-TH") : ""
  );
  const [feeAmountStr, setFeeAmountStr] = useState(
    row.fee_amount ? row.fee_amount.toLocaleString("th-TH") : ""
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Calculations for Won: ยอดที่ผู้ดูแลได้รับ = ยอดสุทธิทั้งหมด - ค่าดำเนินการ
  const isWon = status === "Won";
  const netTotal = parseNumberInput(netTotalStr);
  const feeAmount = parseNumberInput(feeAmountStr);
  const caregiverNet = isWon && netTotal > 0 ? Math.max(0, netTotal - feeAmount) : 0;

  const handleNetTotalBlur = () => {
    if (!netTotalStr.trim()) return;
    const num = parseNumberInput(netTotalStr);
    if (!isNaN(num) && num > 0) {
      setNetTotalStr(num.toLocaleString("th-TH"));
    }
  };

  const handleNetTotalFocus = () => {
    const raw = netTotalStr.replace(/,/g, "");
    setNetTotalStr(raw);
  };

  const handleFeeAmountBlur = () => {
    if (!feeAmountStr.trim()) return;
    const num = parseNumberInput(feeAmountStr);
    if (!isNaN(num) && num >= 0) {
      setFeeAmountStr(num.toLocaleString("th-TH"));
    }
  };

  const handleFeeAmountFocus = () => {
    const raw = feeAmountStr.replace(/,/g, "");
    setFeeAmountStr(raw);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isWon) {
      if (!netTotalStr.trim() || netTotal <= 0) {
        setFormError("กรุณากรอกยอดสุทธิทั้งหมดสำหรับการปิดการขาย (Won)");
        return;
      }
      if (!feeAmountStr.trim() || feeAmount < 0) {
        setFormError("กรุณากรอกค่าดำเนินการให้ถูกต้อง");
        return;
      }
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("job_code", jobCode);
        formData.append("service_date", serviceDate);
        formData.append("care_level", careLevel);
        formData.append("work_format", workFormat);
        formData.append("status", status);

        if (isWon) {
          formData.append("net_total", String(netTotal));
          formData.append("fee_amount", String(feeAmount));
          formData.append("caregiver_net", String(caregiverNet));
        }

        await updateServiceRecipient(row.id, formData);
      } catch (err: unknown) {
        console.error("Update failed:", err);
        setFormError((err as Error)?.message || "เกิดข้อผิดพลาดในการบันทึกการแก้ไข");
      }
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  ยืนยันการบันทึกการแก้ไขข้อมูล
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  กรุณาตรวจสอบข้อมูลก่อนบันทึกการเปลี่ยนแปลง
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="my-4 space-y-2 rounded-xl bg-neutral-50 p-4 text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">รหัสงาน:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{jobCode || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">วันที่รับบริการ:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{serviceDate || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">สถานะ:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{status || "-"}</span>
              </div>

              {isWon && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>ข้อมูลการชำระเงิน (Won)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">ยอดสุทธิทั้งหมด:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(netTotal)} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">ค่าดำเนินการ:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(feeAmount)} ฿
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">ยอดที่ผู้ดูแลได้รับ:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(caregiverNet)} ฿
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              คุณต้องการบันทึกการแก้ไขนี้ใช่หรือไม่?
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              >
                ยกเลิก (No)
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>ยืนยันการบันทึก (Yes)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Link
        href="/data/service-recipients"
        className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
      >
        ← กลับไปหน้าผู้รับบริการ
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        แก้ไขข้อมูลผู้รับบริการ
      </h1>

      {/* Error Alert */}
      {formError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Edit Form */}
      <form
        onSubmit={handlePreSubmit}
        className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">รหัสงาน</span>
            <input
              type="text"
              value={jobCode}
              onChange={(e) => setJobCode(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">วันที่รับบริการ</span>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">ระดับการดูแล</span>
            <input
              type="text"
              value={careLevel}
              onChange={(e) => setCareLevel(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">รูปแบบการทำงาน</span>
            <input
              type="text"
              value={workFormat}
              onChange={(e) => setWorkFormat(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">สถานะ</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">- เลือกสถานะ -</option>
              <option value="Won">Won (ปิดการขายสำเร็จ)</option>
              <option value="กำลังจับคู่">กำลังจับคู่</option>
              <option value="อยู่ระหว่างการดูแล">อยู่ระหว่างการดูแล</option>
              <option value="ยกเลิกงาน">ยกเลิกงาน</option>
              {row.status && !["Won", "กำลังจับคู่", "อยู่ระหว่างการดูแล", "ยกเลิกงาน"].includes(row.status) && (
                <option value={row.status}>{row.status} (เดิม)</option>
              )}
            </select>
          </label>
        </div>

        {/* Conditional Payment Info for "Won" */}
        {isWon && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 dark:border-emerald-900/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    ข้อมูลการชำระเงิน <span className="text-red-500 text-xs font-normal">(บังคับกรอกสำหรับสถานะ Won)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    ระบุยอดสุทธิและค่าดำเนินการ ระบบจะคำนวณยอดที่ผู้ดูแลได้รับให้อัตโนมัติ
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                สถานะ: Won
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. ยอดสุทธิทั้งหมด */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                  <span>1. ยอดสุทธิทั้งหมด (บาท)</span>
                  <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={netTotalStr}
                  onChange={(e) => setNetTotalStr(e.target.value)}
                  onBlur={handleNetTotalBlur}
                  onFocus={handleNetTotalFocus}
                  placeholder="เช่น 1,200"
                  className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 font-mono text-sm font-semibold text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </label>

              {/* 2. ค่าดำเนินการ */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                  <span>2. ค่าดำเนินการ (บาท)</span>
                  <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={feeAmountStr}
                  onChange={(e) => setFeeAmountStr(e.target.value)}
                  onBlur={handleFeeAmountBlur}
                  onFocus={handleFeeAmountFocus}
                  placeholder="เช่น 346.80"
                  className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 font-mono text-sm font-semibold text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </label>

              {/* 3. ยอดที่ผู้ดูแลได้รับ (คำนวณอัตโนมัติ) */}
              <div className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>3. ยอดที่ผู้ดูแลได้รับ (คำนวณอัตโนมัติ)</span>
                </span>
                <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-100/70 px-4 py-2.5 font-mono text-sm font-bold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100">
                  <span>{formatCurrency(caregiverNet)}</span>
                  <span className="text-xs font-normal text-emerald-800 dark:text-emerald-300">บาท (ยอดสุทธิทั้งหมด − ค่าดำเนินการ)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm transition-all disabled:opacity-50"
          >
            <span>บันทึกการแก้ไข</span>
          </button>
          <Link
            href="/data/service-recipients"
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </main>
  );
}
