"use client";

import { useRef, useState } from "react";

type ImportResult = {
  upserted?: number;
  added?: number;
  updated?: number;
  rowsInFile?: number;
  skipped?: { row: number; reason: string }[];
  error?: string;
};

export function CsvUploadCard({
  title,
  description,
  endpoint,
  extraFields,
  accentClass = "border-sky-500",
}: {
  title: string;
  description: string;
  endpoint: string;
  extraFields?: Record<string, string>;
  accentClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setStatus("loading");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    for (const [key, value] of Object.entries(extraFields ?? {})) {
      formData.append(key, value);
    }

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data: ImportResult = await res.json();
      setResult(data);
      setStatus(res.ok ? "done" : "error");
    } catch {
      setResult({ error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" });
      setStatus("error");
    }
  }

  return (
    <div className={`rounded-xl border-t-4 ${accentClass} border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900`}>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:file:bg-neutral-100 dark:file:text-neutral-900"
        />
        <button
          type="submit"
          disabled={!fileName || status === "loading"}
          className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {status === "loading" ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            status === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {status === "error" ? (
            <p>เกิดข้อผิดพลาด: {result.error}</p>
          ) : (
            <>
              <p>
                นำเข้าสำเร็จ {result.upserted?.toLocaleString()} จาก {result.rowsInFile?.toLocaleString()} แถว
              </p>
              {(result.added !== undefined || result.updated !== undefined) && (
                <p className="mt-0.5 opacity-80">
                  เพิ่มใหม่ {result.added?.toLocaleString() ?? 0} แถว · อัปเดตของเดิม{" "}
                  {result.updated?.toLocaleString() ?? 0} แถว — ไม่มีการลบข้อมูลเก่า
                </p>
              )}
            </>
          )}
          {!!result.skipped?.length && (
            <details className="mt-2 text-xs opacity-80">
              <summary className="cursor-pointer">ข้ามไป {result.skipped.length} แถว (ดูรายละเอียด)</summary>
              <ul className="mt-1 list-disc pl-4">
                {result.skipped.slice(0, 20).map((s, idx) => (
                  <li key={idx}>
                    แถว {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
