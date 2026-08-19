import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { latestSnapshot, type LineOaRow } from "@/lib/report";

export const dynamic = "force-dynamic";

async function getOverview() {
  try {
    const supabase = getSupabaseAdmin();
    const [lineOaRes, caregiversRes] = await Promise.all([
      supabase.from("line_oa_daily_stats").select("account, stat_date, contacts, target_reaches, blocks"),
      supabase.from("caregivers").select("id", { count: "exact" }).limit(1),
    ]);

    const lineOaRows = (lineOaRes.data ?? []) as LineOaRow[];
    const carewellteam = latestSnapshot(lineOaRows, "carewellteam");
    const carewell = latestSnapshot(lineOaRows, "carewell");

    return {
      carewellteam: carewellteam.contacts ?? 0,
      carewell: carewell.contacts ?? 0,
      caregivers: caregiversRes.count ?? 0,
      ready: !lineOaRes.error && !caregiversRes.error,
    };
  } catch {
    return { carewellteam: 0, carewell: 0, caregivers: 0, ready: false };
  }
}

export default async function Home() {
  const counts = await getOverview();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">CareWell Report</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        นำเข้าข้อมูล Line OA และผู้ดูแลที่ลงทะเบียน แล้วดูสรุปภาพรวมในรูปแบบสไลด์นำเสนอ
      </p>

      {!counts.ready && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          ยังเชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบว่ารัน <code className="font-mono">supabase/schema.sql</code>{" "}
          ใน Supabase SQL Editor แล้ว และตั้งค่า <code className="font-mono">.env.local</code> ถูกต้อง
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="ผู้ติดตาม @carewellteam" value={counts.carewellteam} />
        <StatCard label="ผู้ติดตาม @carewell" value={counts.carewell} />
        <StatCard label="ผู้ดูแลที่ลงทะเบียน" value={counts.caregivers} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/data"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          นำเข้าข้อมูล
        </Link>
        <Link
          href="/slides"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
        >
          ดูสไลด์นำเสนอ
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
