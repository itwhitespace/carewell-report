import Link from "next/link";
import { CsvUploadCard } from "@/components/CsvUploadCard";

export default function DataPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">นำเข้าข้อมูล</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        อัปโหลดไฟล์ CSV ทั้ง 3 ชุด ระบบจะบันทึกลง Supabase และนำไปสรุปในหน้า Slides โดยอัตโนมัติ
        อัปโหลดซ้ำได้ — แถวที่มีอยู่แล้วจะถูกอัปเดตแทนที่ ไม่สร้างข้อมูลซ้ำ
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <CsvUploadCard
          title="ผู้ติดตาม Line OA — @carewellteam"
          description="คอลัมน์: date, contacts, targetReaches, blocks"
          endpoint="/api/import/line-oa"
          extraFields={{ account: "carewellteam" }}
          accentClass="border-sky-500"
        />
        <CsvUploadCard
          title="ผู้ติดตาม Line OA — @carewell"
          description="คอลัมน์: date, contacts, targetReaches, blocks"
          endpoint="/api/import/line-oa"
          extraFields={{ account: "carewell" }}
          accentClass="border-emerald-500"
        />
        <CsvUploadCard
          title="ผู้ดูแลที่ลงทะเบียนในระบบ"
          description="คอลัมน์: รหัสผู้ดูแล, คำนำหน้า, ชื่อ-นามสกุล, เบอร์โทรศัพท์, เพศ, สถานะ, วันที่สมัคร, วันที่อนุมัติ, ธนาคาร, เลขบัญชี, ตำแหน่ง, ประเภทงาน, จังหวัด, Special Skill, Lifestyle, Badge, วันที่แก้ไขล่าสุด"
          endpoint="/api/import/caregivers"
          accentClass="border-amber-500"
        />
      </div>

      <h2 className="mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">กรอกข้อมูลเอง</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        ข้อมูล 2 ชุดนี้ไม่มีไฟล์ CSV ต้นทาง — กรอกเข้าระบบโดยตรง
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ManualEntryCard
          href="/data/service-recipients"
          title="ผู้รับบริการ"
          description="รหัสงาน, วันที่รับบริการ, ระดับการดูแล, รูปแบบการทำงาน, สถานะ"
          accentClass="border-violet-500"
        />
        <ManualEntryCard
          href="/data/notes"
          title="ประเด็นเพิ่มเติม"
          description="หัวข้อ/บันทึกอิสระ แสดงเป็นสไลด์สุดท้ายของการนำเสนอ"
          accentClass="border-rose-500"
        />
      </div>
    </main>
  );
}

function ManualEntryCard({
  href,
  title,
  description,
  accentClass,
}: {
  href: string;
  title: string;
  description: string;
  accentClass: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border-t-4 ${accentClass} border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900`}
    >
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      <span className="mt-4 inline-block text-sm font-medium text-neutral-900 dark:text-neutral-100">
        ไปกรอกข้อมูล →
      </span>
    </Link>
  );
}
