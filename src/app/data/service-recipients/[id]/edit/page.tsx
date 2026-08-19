import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { updateServiceRecipient } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditServiceRecipientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("service_recipients")
    .select("id, job_code, service_date, care_level, work_format, status")
    .eq("id", id)
    .single();

  if (!row) notFound();

  const updateWithId = updateServiceRecipient.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/data/service-recipients" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้าผู้รับบริการ
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">แก้ไขข้อมูลผู้รับบริการ</h1>

      <form
        action={updateWithId}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Field label="รหัสงาน" name="job_code" defaultValue={row.job_code} />
        <Field label="วันที่รับบริการ" name="service_date" type="date" defaultValue={row.service_date} />
        <Field label="ระดับการดูแล" name="care_level" defaultValue={row.care_level} />
        <Field label="รูปแบบการทำงาน" name="work_format" defaultValue={row.work_format} />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">สถานะ</span>
          <select
            name="status"
            defaultValue={row.status ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <option value="">- เลือกสถานะ -</option>
            <option value="Won">Won</option>
            <option value="กำลังจับคู่">กำลังจับคู่</option>
            <option value="ยกเลิกงาน">ยกเลิกงาน</option>
            {row.status && row.status !== "Won" && row.status !== "กำลังจับคู่" && row.status !== "ยกเลิกงาน" && (
              <option value={row.status}>{row.status} (เดิม)</option>
            )}
          </select>
        </label>

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            บันทึกการแก้ไข
          </button>
          <Link
            href="/data/service-recipients"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | null;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
    </label>
  );
}
