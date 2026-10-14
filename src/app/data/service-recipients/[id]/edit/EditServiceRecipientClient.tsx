"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DollarSign,
  HelpCircle,
  AlertCircle,
  Check,
  UserCheck,
  X,
  Calendar,
} from "lucide-react";
import { updateServiceRecipient } from "../../actions";
import {
  formatCurrency,
  parseNumberInput,
  type ServiceRecipientRow,
} from "../../ServiceRecipientsClient";
import { parsePaidInstallments } from "@/lib/report";

function parseInitialWorkFormat(raw: string | null | undefined): { format: string; month: string } {
  if (!raw) return { format: "", month: "" };
  const val = raw.trim();
  if (val === "แบบไป-กลับ") {
    return { format: "แบบไป-กลับ", month: "" };
  }
  if (val === "แบบประจำ(รายวัน)" || val === "แบบประจำ (รายวัน)") {
    return { format: "แบบประจำ(รายวัน)", month: "" };
  }
  if (val.includes("รายเดือน")) {
    const match = val.match(/(\d+)\s*เดือน/);
    if (match && Number(match[1]) >= 1 && Number(match[1]) <= 12) {
      return { format: "แบบประจำ(รายเดือน)", month: `${match[1]} เดือน` };
    }
    return { format: "แบบประจำ(รายเดือน)", month: "" };
  }
  return { format: val, month: "" };
}

function getInstallmentMonth(dateStr: string, index: number): string {
  if (!dateStr) return `งวดที่ ${index + 1}`;
  try {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10) - 1 + index;
      while (m >= 12) {
        m -= 12;
        y += 1;
      }
      const THAI_MONTHS_SHORT = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      return `${THAI_MONTHS_SHORT[m]} ${y}`;
    }
    return `งวดที่ ${index + 1}`;
  } catch {
    return `งวดที่ ${index + 1}`;
  }
}

export function EditServiceRecipientClient({
  row,
}: {
  row: ServiceRecipientRow;
}) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const initialWork = parseInitialWorkFormat(row.work_format);
  const [jobCode, setJobCode] = useState(row.job_code ?? "");
  const [serviceDate, setServiceDate] = useState(row.service_date ?? "");
  const [careLevel, setCareLevel] = useState(row.care_level ?? "");
  const [workFormat, setWorkFormat] = useState(initialWork.format);
  const [workMonth, setWorkMonth] = useState(initialWork.month);
  const [status, setStatus] = useState(row.status ?? "");

  // Payment Form State
  const [netTotalStr, setNetTotalStr] = useState(
    row.net_total ? row.net_total.toLocaleString("th-TH") : ""
  );
  const [feeAmountStr, setFeeAmountStr] = useState(
    row.fee_amount ? row.fee_amount.toLocaleString("th-TH") : ""
  );

  // Installment State
  const initialPaid = parsePaidInstallments(row.cancel_reason);
  const [paidInstallments, setPaidInstallments] = useState<number>(initialPaid);

  // Cancellation Reason State
  const [cancelReason, setCancelReason] = useState(
    row.status === "ยกเลิกงาน" ? row.cancel_reason ?? "" : ""
  );

  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const computedWorkFormat =
    workFormat === "แบบประจำ(รายเดือน)"
      ? workMonth
        ? `แบบประจำ(รายเดือน) ${workMonth}`
        : "แบบประจำ(รายเดือน)"
      : workFormat;

  const durationMatch = computedWorkFormat.match(/(\d+)\s*เดือน/);
  const contractDuration = durationMatch ? parseInt(durationMatch[1], 10) : 1;
  const isMonthlyContract = computedWorkFormat.includes("รายเดือน") && contractDuration > 1;

  // Calculations for Won: ยอดที่ผู้ดูแลได้รับ = ยอดสุทธิทั้งหมด - ค่าดำเนินการ
  const isWon = status === "Won";
  const isCancelled = status === "ยกเลิกงาน";
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

    if (isCancelled) {
      if (!cancelReason.trim()) {
        setFormError("กรุณาระบุสาเหตุการยกเลิกงานสำหรับการบันทึกสถานะยกเลิกงาน");
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
        formData.append("work_format", computedWorkFormat);
        formData.append("status", status);

        if (isWon) {
          formData.append("net_total", String(netTotal));
          formData.append("fee_amount", String(feeAmount));
          formData.append("caregiver_net", String(caregiverNet));
          formData.append("paid_installments", String(paidInstallments));
        }

        if (isCancelled) {
          formData.append("cancel_reason", cancelReason.trim());
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
                <span className="text-neutral-500">รูปแบบการทำงาน:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{computedWorkFormat || "-"}</span>
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
                  {isMonthlyContract && (
                    <div className="flex justify-between pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                      <span className="text-neutral-500">สถานะการเก็บเงิน:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        เก็บแล้ว {paidInstallments} จาก {contractDuration} งวด
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isCancelled && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>ข้อมูลการยกเลิกงาน</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500 shrink-0">สาเหตุ:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400 text-right">
                      {cancelReason || "-"}
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
            <select
              value={workFormat}
              onChange={(e) => {
                setWorkFormat(e.target.value);
                if (e.target.value !== "แบบประจำ(รายเดือน)") {
                  setWorkMonth("");
                }
              }}
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">- เลือกรูปแบบการทำงาน -</option>
              <option value="แบบไป-กลับ">แบบไป-กลับ</option>
              <option value="แบบประจำ(รายวัน)">แบบประจำ(รายวัน)</option>
              <option value="แบบประจำ(รายเดือน)">แบบประจำ(รายเดือน)</option>
              {workFormat &&
                !["แบบไป-กลับ", "แบบประจำ(รายวัน)", "แบบประจำ(รายเดือน)"].includes(workFormat) && (
                  <option value={workFormat}>{workFormat} (เดิม)</option>
                )}
            </select>
          </label>

          {workFormat === "แบบประจำ(รายเดือน)" && (
            <label className="flex flex-col gap-1 text-sm sm:col-span-2 animate-in fade-in duration-200">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                ระยะเวลา <span className="text-xs text-neutral-500 font-normal">(จำนวนเดือน)</span>
              </span>
              <select
                value={workMonth}
                onChange={(e) => setWorkMonth(e.target.value)}
                className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              >
                <option value="">- เลือกระยะเวลา -</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={`${m} เดือน`}>
                    {m} เดือน
                  </option>
                ))}
              </select>
            </label>
          )}

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

              {/* Installment Payment Tracking Table (for multi-month contracts) */}
              {isMonthlyContract && (
                <div className="mt-2 pt-4 border-t border-emerald-200/80 dark:border-emerald-800/60 sm:col-span-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>ตารางติดตามการเก็บเงินตามงวดสัญญา ({contractDuration} งวด)</span>
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        แสดงข้อมูลทางการเงินในแต่ละงวด และบันทึกสถานะการรับเงินจริงเพื่อนำไปสรุปผลบน Slide สรุปยอด
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        เก็บเงินแล้ว {paidInstallments} จาก {contractDuration} งวด
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-between">
                        <span>🟢 ยอดที่เก็บเงินแล้วจริง (Realized - {paidInstallments} งวด):</span>
                        <span className="font-bold font-mono text-emerald-900 dark:text-emerald-200">
                          {formatCurrency(netTotal * paidInstallments)} ฿
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
                        <span>ค่าดำเนินการ: {formatCurrency(feeAmount * paidInstallments)} ฿</span>
                        <span>ผู้ดูแล: {formatCurrency(caregiverNet * paidInstallments)} ฿</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800/60 dark:bg-amber-950/30">
                      <div className="font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center justify-between">
                        <span>🟠 ยอดรอเก็บในอนาคต (Pending - {Math.max(0, contractDuration - paidInstallments)} งวด):</span>
                        <span className="font-bold font-mono text-amber-900 dark:text-amber-200">
                          {formatCurrency(netTotal * Math.max(0, contractDuration - paidInstallments))} ฿
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-400">
                        <span>ค่าดำเนินการ: {formatCurrency(feeAmount * Math.max(0, contractDuration - paidInstallments))} ฿</span>
                        <span>ผู้ดูแล: {formatCurrency(caregiverNet * Math.max(0, contractDuration - paidInstallments))} ฿</span>
                      </div>
                    </div>
                  </div>

                  {/* Installment Table */}
                  <div className="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-neutral-900 shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 font-semibold border-b border-emerald-200 dark:border-emerald-800">
                        <tr>
                          <th className="py-2.5 px-3">งวดที่ / เดือน</th>
                          <th className="py-2.5 px-3 text-right">1. ยอดสุทธิทั้งหมด</th>
                          <th className="py-2.5 px-3 text-right">2. ค่าดำเนินการ</th>
                          <th className="py-2.5 px-3 text-right">3. ยอดที่ผู้ดูแลได้รับ</th>
                          <th className="py-2.5 px-3 text-center">สถานะการเก็บเงิน</th>
                          <th className="py-2.5 px-3 text-center">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                        {Array.from({ length: contractDuration }, (_, i) => {
                          const isPaid = i < paidInstallments;
                          const monthLabel = getInstallmentMonth(serviceDate, i);
                          return (
                            <tr
                              key={i}
                              className={isPaid ? "bg-emerald-50/20 dark:bg-emerald-950/20" : "bg-neutral-50/20 dark:bg-neutral-900/40"}
                            >
                              <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                <div className="flex items-center gap-1.5">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-[11px] font-bold">
                                    {i + 1}
                                  </span>
                                  <span>{monthLabel}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatCurrency(netTotal)} ฿
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                                {formatCurrency(feeAmount)} ฿
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(caregiverNet)} ฿
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    เก็บเงินแล้ว (Realized)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/70 dark:text-amber-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                    รอเก็บเงิน (Pending)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isPaid) {
                                      setPaidInstallments(i);
                                    } else {
                                      setPaidInstallments(i + 1);
                                    }
                                  }}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shadow-2xs ${
                                    isPaid
                                      ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                                  }`}
                                >
                                  {isPaid ? "เปลี่ยนเป็นรอเก็บ" : "ทำเครื่องหมายว่าเก็บแล้ว"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>คลิกปุ่มในคอลัมน์การจัดการ เพื่ออัปเดตสถานะการเก็บเงินแต่ละงวด</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPaidInstallments(contractDuration)}
                        className="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        เก็บครบทุกงวด
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setPaidInstallments(1)}
                        className="text-[11px] font-medium text-neutral-600 hover:underline dark:text-neutral-400"
                      >
                        เก็บเฉพาะงวดแรก
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setPaidInstallments(0)}
                        className="text-[11px] font-medium text-amber-600 hover:underline dark:text-amber-400"
                      >
                        ยังไม่เก็บทุกงวด
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conditional Cancellation Reason for "ยกเลิกงาน" */}
        {isCancelled && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/50 dark:bg-red-950/20 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-red-200/80 dark:border-red-900/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
                  <X className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    ข้อมูลการยกเลิกงาน <span className="text-red-500 text-xs font-normal">(บังคับกรอกสำหรับสถานะยกเลิกงาน)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    ระบุสาเหตุที่ลูกค้ายกเลิก เพื่อนำไปสรุปสถิติและวิเคราะห์แนวทางการแก้ไข
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/60 dark:text-red-300">
                สถานะ: ยกเลิกงาน
              </span>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <span>สาเหตุ:</span>
                <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="เช่น ลูกค้าหาผู้ดูแลได้เอง / ติดปัญหาเรื่องราคา / เลื่อนการรับบริการไม่มีกำหนด"
                className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-red-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>
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
