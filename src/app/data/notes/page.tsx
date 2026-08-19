import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createNote, deleteNote } from "./actions";

export const dynamic = "force-dynamic";

type Note = { id: string; topic: string; detail: string | null };

async function getNotes(): Promise<Note[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("report_notes")
    .select("id, topic, detail")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/data" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← กลับไปหน้านำเข้าข้อมูล
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">ประเด็นเพิ่มเติม</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        หัวข้อ/บันทึกเพิ่มเติมที่อยากใส่ท้ายสไลด์นำเสนอ — เพิ่มได้กี่หัวข้อก็ได้ จะแสดงเป็นสไลด์สุดท้ายตามลำดับด้านล่าง
      </p>

      <form
        action={createNote}
        className="mt-6 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">หัวข้อ</span>
          <input
            type="text"
            name="topic"
            required
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">รายละเอียด (ถ้ามี)</span>
          <textarea
            name="detail"
            rows={3}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          เพิ่มหัวข้อ
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-3">
        {notes.length === 0 ? (
          <p className="text-sm text-neutral-400">ยังไม่มีบันทึกเพิ่มเติม</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{note.topic}</p>
                {note.detail && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                    {note.detail}
                  </p>
                )}
              </div>
              <form action={deleteNote.bind(null, note.id)}>
                <button
                  type="submit"
                  className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  ลบ
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
