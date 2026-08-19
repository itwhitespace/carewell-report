"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function createNote(formData: FormData) {
  const topic = String(formData.get("topic") ?? "").trim();
  const detailRaw = String(formData.get("detail") ?? "").trim();
  if (!topic) throw new Error("กรุณากรอกหัวข้อ");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("report_notes").insert({
    topic,
    detail: detailRaw === "" ? null : detailRaw,
  });
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
