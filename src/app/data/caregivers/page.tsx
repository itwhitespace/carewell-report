import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createCaregiver, deleteCaregiver } from "./actions";

export const dynamic = "force-dynamic";

type Caregiver = {
  id: string;
  caregiver_code: string;
  prefix: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  status: string | null;
  position: string | null;
  province: string | null;
  registered_date: string | null;
  approved_date: string | null;
};

async function getCaregivers(): Promise<Caregiver[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("caregivers")
    .select("id, caregiver_code, prefix, full_name, phone, gender, status, position, province, registered_date, approved_date")
    .order("registered_date", { ascending: false, nullsFirst: false })
    .order("caregiver_code", { ascending: true });
  return data ?? [];
}

export default async function CaregiversPage() {
  const caregivers = await getCaregivers();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/data" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้านำเข้าข้อมูล
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">รายชื่อผู้ดูแลที่ลงทะเบียน</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            จัดการข้อมูลผู้ดูแล เพิ่ม แก้ไข หรือลบข้อมูลในระบบ (รวมทั้งหมด {caregivers.length} คน)
          </p>
        </div>
      </div>

      {/* Add New Caregiver Form */}
      <details className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <summary className="cursor-pointer font-semibold text-amber-900 dark:text-amber-300">
          + เพิ่มข้อมูลผู้ดูแลใหม่
        </summary>
        <form
          action={createCaregiver}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Field label="รหัสผู้ดูแล (เช่น CG-001)" name="caregiver_code" placeholder="หากเว้นไว้ระบบจะสร้างให้อัตโนมัติ" />
          <Field label="คำนำหน้า" name="prefix" placeholder="นาย / นาง / นางสาว" />
          <Field label="ชื่อ-นามสกุล" name="full_name" required />
          <Field label="เบอร์โทรศัพท์" name="phone" />
          <SelectField
            label="เพศ"
            name="gender"
            options={[
              { value: "", label: "- เลือกเพศ -" },
              { value: "ชาย", label: "ชาย" },
              { value: "หญิง", label: "หญิง" },
              { value: "อื่นๆ", label: "อื่นๆ" },
            ]}
          />
          <Field label="ตำแหน่ง" name="position" placeholder="RN / PN / NA / CG" />
          <Field label="จังหวัด" name="province" />
          <Field label="วันที่สมัคร" name="registered_date" type="date" />
          <Field label="วันที่อนุมัติ" name="approved_date" type="date" />
          <SelectField
            label="สถานะ"
            name="status"
            options={[
              { value: "อนุมัติแล้ว", label: "อนุมัติแล้ว" },
              { value: "รออนุมัติ", label: "รออนุมัติ" },
              { value: "ไม่อนุมัติ", label: "ไม่อนุมัติ" },
            ]}
          />
          <Field label="ทักษะพิเศษ (Special Skill)" name="special_skill" className="sm:col-span-2" />

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              บันทึกผู้ดูแลใหม่
            </button>
          </div>
        </form>
      </details>

      {/* Table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
              <Th>รหัสผู้ดูแล</Th>
              <Th>ชื่อ-นามสกุล</Th>
              <Th>เบอร์โทร</Th>
              <Th>ตำแหน่ง</Th>
              <Th>จังหวัด</Th>
              <Th>วันที่สมัคร</Th>
              <Th>สถานะ</Th>
              <Th className="text-right">จัดการ</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {caregivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                  ยังไม่มีข้อมูลผู้ดูแลในระบบ
                </td>
              </tr>
            ) : (
              caregivers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <Td className="font-mono font-medium">{c.caregiver_code}</Td>
                  <Td className="font-medium text-neutral-900 dark:text-neutral-100">
                    {c.prefix ? `${c.prefix} ` : ""}{c.full_name || "-"}
                  </Td>
                  <Td>{c.phone || "-"}</Td>
                  <Td>{c.position || "-"}</Td>
                  <Td>{c.province || "-"}</Td>
                  <Td>{c.registered_date || "-"}</Td>
                  <Td>
                    <StatusBadge status={c.status} approved={!!c.approved_date} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/data/caregivers/${c.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        แก้ไข
                      </Link>
                      <form action={deleteCaregiver.bind(null, c.id)}>
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
  placeholder,
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        required={required}
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

function StatusBadge({ status, approved }: { status: string | null; approved: boolean }) {
  const displayStatus = status || (approved ? "อนุมัติแล้ว" : "รออนุมัติ");
  const isApproved = displayStatus.includes("อนุมัติ") && !displayStatus.includes("ไม่");
  const isRejected = displayStatus.includes("ไม่");

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isApproved
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : isRejected
            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
      }`}
    >
      {displayStatus}
    </span>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-neutral-800 dark:text-neutral-200 ${className}`}>{children}</td>;
}
