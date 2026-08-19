import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createServiceRecipient, deleteServiceRecipient } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  job_code: string | null;
  service_date: string | null;
  care_level: string | null;
  work_format: string | null;
  status: string | null;
};

async function getRows(): Promise<Row[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("service_recipients")
    .select("id, job_code, service_date, care_level, work_format, status")
    .order("service_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function ServiceRecipientsPage() {
  const rows = await getRows();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/data" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้านำเข้าข้อมูล
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">ผู้รับบริการ</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        ข้อมูลผู้รับบริการที่ลงทะเบียน — กรอกเข้าระบบเอง ไม่ได้นำเข้าจากไฟล์ CSV
      </p>

      <form
        action={createServiceRecipient}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Field label="รหัสงาน" name="job_code" />
        <Field label="วันที่รับบริการ" name="service_date" type="date" />
        <Field label="ระดับการดูแล" name="care_level" />
        <Field label="รูปแบบการทำงาน" name="work_format" />
        <SelectField
          label="สถานะ"
          name="status"
          className="sm:col-span-2"
          options={[
            { value: "", label: "- เลือกสถานะ -" },
            { value: "Won", label: "Won" },
            { value: "ยกเลิกงาน", label: "ยกเลิกงาน" },
          ]}
        />

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            เพิ่มข้อมูล
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800">
              <Th>รหัสงาน</Th>
              <Th>วันที่รับบริการ</Th>
              <Th>ระดับการดูแล</Th>
              <Th>รูปแบบการทำงาน</Th>
              <Th>สถานะ</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  ยังไม่มีข้อมูลผู้รับบริการ
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <Td>{r.job_code ?? "-"}</Td>
                  <Td>{r.service_date ?? "-"}</Td>
                  <Td>{r.care_level ?? "-"}</Td>
                  <Td>{r.work_format ?? "-"}</Td>
                  <Td>
                    <StatusTag status={r.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/data/service-recipients/${r.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        แก้ไข
                      </Link>
                      <form action={deleteServiceRecipient.bind(null, r.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          ลบ
                        </button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <input
        type={type}
        name={name}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  className = "",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <select
        name={name}
        defaultValue=""
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusTag({ status }: { status: string | null }) {
  if (!status) return <span className="text-neutral-400">-</span>;
  const isWon = status === "Won";
  const isCancelled = status === "ยกเลิกงาน";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isWon
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : isCancelled
            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      }`}
    >
      {status}
    </span>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-neutral-800 dark:text-neutral-200">{children}</td>;
}
