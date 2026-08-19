"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function textOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export async function createServiceRecipient(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("service_recipients").insert({
    job_code: textOrNull(formData, "job_code"),
    service_date: textOrNull(formData, "service_date"),
    care_level: textOrNull(formData, "care_level"),
    work_format: textOrNull(formData, "work_format"),
    status: textOrNull(formData, "status"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/data/service-recipients");
}

export async function updateServiceRecipient(id: string, formData: FormData) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("service_recipients")
    .update({
      job_code: textOrNull(formData, "job_code"),
      service_date: textOrNull(formData, "service_date"),
      care_level: textOrNull(formData, "care_level"),
      work_format: textOrNull(formData, "work_format"),
      status: textOrNull(formData, "status"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/data/service-recipients");
  redirect("/data/service-recipients");
}

export async function deleteServiceRecipient(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("service_recipients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/data/service-recipients");
}
