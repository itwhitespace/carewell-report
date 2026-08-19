import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseNoteDetail, type NoteItem } from "@/lib/notes";
import { NotesTable } from "./NotesTable";

export const dynamic = "force-dynamic";

async function getNotes(): Promise<NoteItem[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("report_notes")
    .select("id, topic, detail, sort_order, created_at")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const { status, detail } = parseNoteDetail(row.detail);
    return {
      id: row.id,
      topic: row.topic,
      detail,
      status,
      rawDetail: row.detail,
      sort_order: row.sort_order,
      created_at: row.created_at,
    };
  });
}

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/data" className="text-sm font-medium text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้านำเข้าข้อมูล
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">ประเด็นเพิ่มเติม</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        จัดการประเด็นเพิ่มเติม/ประวัติการติดตามงาน — เลือกสถานะ “ประเด็นใหม่” หรือ “ดำเนินการแล้ว” สามารถแก้ไขและแสดงผลในสไลด์นำเสนออัตโนมัติ
      </p>

      <NotesTable notes={notes} />
    </main>
  );
}
