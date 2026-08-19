import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { updateCaregiver } from "../../actions";
import { formatPositionLabel } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function EditCaregiverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("caregivers")
    .select("*")
    .eq("id", id)
    .single();

  if (!row) notFound();

  const updateWithId = updateCaregiver.bind(null, id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/data/caregivers" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้าจัดการผู้ดูแล
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        แก้ไขข้อมูลผู้ดูแล: {row.caregiver_code}
      </h1>

      <form
        action={updateWithId}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Field label="รหัสผู้ดูแล" name="caregiver_code" defaultValue={row.caregiver_code} required />
        <Field label="คำนำหน้า" name="prefix" defaultValue={row.prefix} />
        <Field label="ชื่อ-นามสกุล" name="full_name" defaultValue={row.full_name} required />
        <Field label="เบอร์โทรศัพท์" name="phone" defaultValue={row.phone} />
        <SelectField
          label="เพศ"
          name="gender"
          defaultValue={row.gender ?? ""}
          options={[
            { value: "", label: "- เลือกเพศ -" },
            { value: "ชาย", label: "ชาย" },
            { value: "หญิง", label: "หญิง" },
            { value: "อื่นๆ", label: "อื่นๆ" },
          ]}
        />
        <SelectField
          label="ตำแหน่ง / คุณวุฒิ"
          name="position"
          defaultValue={formatPositionLabel(row.position)}
          options={[
            { value: "", label: "- เลือกตำแหน่ง -" },
            { value: "พยาบาลวิชาชีพ (RN)", label: "พยาบาลวิชาชีพ (RN)" },
            { value: "ผู้ช่วยพยาบาล (PN)", label: "ผู้ช่วยพยาบาล (PN)" },
            { value: "พนักงานช่วยการพยาบาล (NA)", label: "พนักงานช่วยการพยาบาล (NA)" },
            { value: "ผู้ดูแลผู้ป่วย (CG)", label: "ผู้ดูแลผู้ป่วย (CG)" },
          ]}
        />
        <Field label="ประเภทงาน" name="job_type" defaultValue={row.job_type} />
        <Field label="จังหวัด" name="province" defaultValue={row.province} />
        <Field label="วันที่สมัคร" name="registered_date" type="date" defaultValue={row.registered_date} />
        <Field label="วันที่อนุมัติ" name="approved_date" type="date" defaultValue={row.approved_date} />
        
        <SelectField
          label="สถานะ"
          name="status"
          defaultValue={row.status ?? ""}
          options={[
            { value: "อนุมัติแล้ว", label: "อนุมัติแล้ว" },
            { value: "รออนุมัติ", label: "รออนุมัติ" },
            { value: "ไม่อนุมัติ", label: "ไม่อนุมัติ" },
          ]}
        />

        <Field label="Special Skill" name="special_skill" defaultValue={row.special_skill} className="sm:col-span-2" />
        <Field label="Lifestyle" name="lifestyle" defaultValue={row.lifestyle} className="sm:col-span-2" />
        <Field label="Badge" name="badge" defaultValue={row.badge} className="sm:col-span-2" />

        <div className="mt-4 flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            บันทึกการแก้ไข
          </button>
          <Link
            href="/data/caregivers"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
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
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | null;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
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
