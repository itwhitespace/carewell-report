"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function textOrNull(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").replace(/,/g, "").trim();
  if (raw === "") return null;
  const num = Number(raw);
  return isNaN(num) ? null : num;
}

export async function createServiceRecipient(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const status = textOrNull(formData, "status");
  const isWon = status === "Won";
  const isCancelled = status === "ยกเลิกงาน";

  const net_total = isWon ? numberOrNull(formData, "net_total") : null;
  const fee_percent = isWon ? numberOrNull(formData, "fee_percent") : null;
  const fee_amount = isWon ? numberOrNull(formData, "fee_amount") : null;
  const caregiver_net = isWon ? numberOrNull(formData, "caregiver_net") : null;
  const cancel_reason = isCancelled ? textOrNull(formData, "cancel_reason") : null;

  const { error } = await supabase.from("service_recipients").insert({
    job_code: textOrNull(formData, "job_code"),
    service_date: textOrNull(formData, "service_date"),
    care_level: textOrNull(formData, "care_level"),
    work_format: textOrNull(formData, "work_format"),
    status,
    net_total,
    fee_percent,
    fee_amount,
    caregiver_net,
    cancel_reason,
  });

  if (error) {
    console.error("Error creating service recipient:", error);
    throw new Error(error.message);
  }

  revalidatePath("/data/service-recipients");
}

export async function updateServiceRecipient(id: string, formData: FormData) {
  const supabase = getSupabaseAdmin();
  const status = textOrNull(formData, "status");
  const isWon = status === "Won";
  const isCancelled = status === "ยกเลิกงาน";

  const net_total = isWon ? numberOrNull(formData, "net_total") : null;
  const fee_percent = isWon ? numberOrNull(formData, "fee_percent") : null;
  const fee_amount = isWon ? numberOrNull(formData, "fee_amount") : null;
  const caregiver_net = isWon ? numberOrNull(formData, "caregiver_net") : null;
  const cancel_reason = isCancelled ? textOrNull(formData, "cancel_reason") : null;

  const { error } = await supabase
    .from("service_recipients")
    .update({
      job_code: textOrNull(formData, "job_code"),
      service_date: textOrNull(formData, "service_date"),
      care_level: textOrNull(formData, "care_level"),
      work_format: textOrNull(formData, "work_format"),
      status,
      net_total,
      fee_percent,
      fee_amount,
      caregiver_net,
      cancel_reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating service recipient:", error);
    throw new Error(error.message);
  }

  revalidatePath("/data/service-recipients");
  redirect("/data/service-recipients");
}

export async function deleteServiceRecipient(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("service_recipients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/data/service-recipients");
}
