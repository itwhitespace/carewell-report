"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatNoteDetail, type NoteStatus } from "@/lib/notes";

export async function createNote(formData: FormData) {
  const topic = String(formData.get("topic") ?? "").trim();
  const detailRaw = String(formData.get("detail") ?? "").trim();
  const status = (String(formData.get("status") ?? "ประเด็นใหม่").trim() as NoteStatus) || "ประเด็นใหม่";
  
  if (!topic) throw new Error("กรุณากรอกหัวข้อ");

  const supabase = getSupabaseAdmin();
  const formattedDetail = formatNoteDetail(status, detailRaw);

  const { error } = await supabase.from("report_notes").insert({
    topic,
    detail: formattedDetail,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/data/notes");
  revalidatePath("/slides");
}

export async function updateNote(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const detailRaw = String(formData.get("detail") ?? "").trim();
  const status = (String(formData.get("status") ?? "ประเด็นใหม่").trim() as NoteStatus) || "ประเด็นใหม่";

  if (!id) throw new Error("ไม่พบรหัสรายการ");
  if (!topic) throw new Error("กรุณากรอกหัวข้อ");

  const supabase = getSupabaseAdmin();
  const formattedDetail = formatNoteDetail(status, detailRaw);

  const { error } = await supabase
    .from("report_notes")
    .update({
      topic,
      detail: formattedDetail,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/data/notes");
  revalidatePath("/slides");
}

export async function deleteNote(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("report_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/data/notes");
  revalidatePath("/slides");
}
