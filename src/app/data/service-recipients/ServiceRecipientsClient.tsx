"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  Calculator,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { createServiceRecipient, deleteServiceRecipient } from "./actions";

export type ServiceRecipientRow = {
  id: string;
  job_code: string | null;
  service_date: string | null;
  care_level: string | null;
  work_format: string | null;
  status: string | null;
  net_total: number | null;
  fee_percent: number | null;
  fee_amount: number | null;
  caregiver_net: number | null;
  cancel_reason: string | null;
};

// Helper: Format number with commas
export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Helper: Parse string to clean number
export function parseNumberInput(val: string): number {
  const clean = val.replace(/,/g, "").trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function ServiceRecipientsClient({
  initialRows,
}: {
  initialRows: ServiceRecipientRow[];
}) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [jobCode, setJobCode] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [workFormat, setWorkFormat] = useState("");
  const [status, setStatus] = useState("");

  // Payment Form State (for Won)
  const [netTotalStr, setNetTotalStr] = useState("");
  const [feeAmountStr, setFeeAmountStr] = useState("");

  // Cancellation Reason State (for ยกเลิกงาน)
  const [cancelReason, setCancelReason] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Table Filter State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ทั้งหมด");

  // Calculations for Won: ยอดที่ผู้ดูแลได้รับ = ยอดสุทธิทั้งหมด - ค่าดำเนินการ
  const isWon = status === "Won";
  const isCancelled = status === "ยกเลิกงาน";
  const netTotal = parseNumberInput(netTotalStr);
  const feeAmount = parseNumberInput(feeAmountStr);
  const caregiverNet = isWon && netTotal > 0 ? Math.max(0, netTotal - feeAmount) : 0;

  // Formatting netTotal on blur
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

  // Formatting feeAmount on blur
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

  // Pre-submit validation and opening Confirm Modal
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

  // Confirm and execute creation
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

        if (isCancelled) {
          formData.append("cancel_reason", cancelReason.trim());
        }

        await createServiceRecipient(formData);

        // Reset form
        setJobCode("");
        setServiceDate("");
        setCareLevel("");
        setWorkFormat("");
        setStatus("");
        setNetTotalStr("");
        setFeeAmountStr("");
        setCancelReason("");
        setFormError(null);
      } catch (err: unknown) {
        console.error("Create failed:", err);
        setFormError((err as Error)?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    });
  };

  // Table Filter Counts
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      ทั้งหมด: initialRows.length,
      Won: 0,
      กำลังจับคู่: 0,
      อยู่ระหว่างการดูแล: 0,
      ยกเลิกงาน: 0,
    };
    initialRows.forEach((r) => {
      if (r.status && map[r.status] !== undefined) {
        map[r.status]++;
      }
    });
    return map;
  }, [initialRows]);

  const filteredRows = useMemo(() => {
    if (selectedStatusFilter === "ทั้งหมด") return initialRows;
    return initialRows.filter((r) => r.status === selectedStatusFilter);
  }, [initialRows, selectedStatusFilter]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
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
                  ยืนยันการบันทึกข้อมูลผู้รับบริการ
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  กรุณาตรวจสอบข้อมูลก่อนทำการบันทึก
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
              คุณต้องการบันทึกข้อมูลนี้ลงในระบบใช่หรือไม่?
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
      <Link href="/data" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้านำเข้าข้อมูล
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">ผู้รับบริการ</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        ข้อมูลผู้รับบริการที่ลงทะเบียน — กรอกเข้าระบบเอง ไม่ได้นำเข้าจากไฟล์ CSV
      </p>

      {/* Error Alert */}
      {formError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Input Form */}
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
              placeholder="เช่น SR-2605-0044"
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
              placeholder="เช่น ดูแลตัวเองได้, ช่วยดูแลบางส่วน"
              className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">รูปแบบการทำงาน</span>
            <input
              type="text"
              value={workFormat}
              onChange={(e) => setWorkFormat(e.target.value)}
              placeholder="เช่น แบบประจำ (รายวัน), 12 ชม."
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm transition-all disabled:opacity-50"
          >
            <span>เพิ่มข้อมูล</span>
          </button>
        </div>
      </form>

      {/* Table Section with Status Filter */}
      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              กรองตามสถานะ:
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["ทั้งหมด", "Won", "กำลังจับคู่", "อยู่ระหว่างการดูแล", "ยกเลิกงาน"].map((st) => {
              const isActive = selectedStatusFilter === st;
              const count = counts[st] ?? 0;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900"
                      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table - Columns swapped: วันที่รับบริการ (1st), รหัสงาน (2nd) */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-400">
                <th className="px-4 py-3 text-left">วันที่รับบริการ</th>
                <th className="px-4 py-3 text-left">รหัสงาน</th>
                <th className="px-4 py-3 text-left">ระดับการดูแล</th>
                <th className="px-4 py-3 text-left">รูปแบบการทำงาน</th>
                <th className="px-4 py-3 text-left">สถานะ</th>
                <th className="px-4 py-3 text-right">ยอดสุทธิ (Won)</th>
                <th className="px-4 py-3 text-right">ยอดผู้ดูแลรับ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-400">
                    ไม่พบข้อมูลผู้รับบริการในสถานะนี้
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Swapped: วันที่รับบริการ first */}
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap font-medium">
                      {r.service_date ?? "-"}
                    </td>

                    {/* Swapped: รหัสงาน second */}
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {r.job_code ?? "-"}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {r.care_level ?? "-"}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {r.work_format ?? "-"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusTag status={r.status} />
                      {r.status === "ยกเลิกงาน" && r.cancel_reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-normal max-w-[220px] truncate" title={r.cancel_reason}>
                          <span className="font-semibold">สาเหตุ:</span> {r.cancel_reason}
                        </div>
                      )}
                    </td>

                    {/* Payment Info columns */}
                    <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                      {r.status === "Won" && r.net_total !== null && r.net_total !== undefined ? (
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(r.net_total)} ฿
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                      {r.status === "Won" && r.caregiver_net !== null && r.caregiver_net !== undefined ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(r.caregiver_net)} ฿
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/data/service-recipients/${r.id}/edit`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          แก้ไข
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`คุณต้องการลบข้อมูลรหัสงาน "${r.job_code || r.id}" ใช่หรือไม่?`)) {
                              startTransition(async () => {
                                await deleteServiceRecipient(r.id);
                              });
                            }
                          }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatusTag({ status }: { status: string | null }) {
  if (!status) return <span className="text-neutral-400">-</span>;
  const isWon = status === "Won";
  const isMatching = status === "กำลังจับคู่";
  const isUnderCare = status === "อยู่ระหว่างการดูแล";
  const isCancelled = status === "ยกเลิกงาน";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isWon
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : isMatching
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
            : isUnderCare
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              : isCancelled
                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      }`}
    >
      {status}
    </span>
  );
}
