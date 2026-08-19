"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function textOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function textOrUndefined(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? undefined : value;
}

export async function createCaregiver(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const caregiver_code = textOrUndefined(formData, "caregiver_code") || `CG-${Date.now().toString().slice(-6)}`;
  
  const { error } = await supabase.from("caregivers").insert({
    caregiver_code,
    prefix: textOrNull(formData, "prefix"),
    full_name: textOrNull(formData, "full_name"),
    phone: textOrNull(formData, "phone"),
    gender: textOrNull(formData, "gender"),
    status: textOrNull(formData, "status"),
    position: textOrNull(formData, "position"),
    job_type: textOrNull(formData, "job_type"),
    province: textOrNull(formData, "province"),
    registered_date: textOrNull(formData, "registered_date"),
    approved_date: textOrNull(formData, "approved_date"),
    special_skill: textOrNull(formData, "special_skill"),
    lifestyle: textOrNull(formData, "lifestyle"),
    badge: textOrNull(formData, "badge"),
    updated_date: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/data/caregivers");
  revalidatePath("/data");
  revalidatePath("/");
}

export async function updateCaregiver(id: string, formData: FormData) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from("caregivers")
    .update({
      caregiver_code: textOrUndefined(formData, "caregiver_code"),
      prefix: textOrNull(formData, "prefix"),
      full_name: textOrNull(formData, "full_name"),
      phone: textOrNull(formData, "phone"),
      gender: textOrNull(formData, "gender"),
      status: textOrNull(formData, "status"),
      position: textOrNull(formData, "position"),
      job_type: textOrNull(formData, "job_type"),
      province: textOrNull(formData, "province"),
      registered_date: textOrNull(formData, "registered_date"),
      approved_date: textOrNull(formData, "approved_date"),
      special_skill: textOrNull(formData, "special_skill"),
      lifestyle: textOrNull(formData, "lifestyle"),
      badge: textOrNull(formData, "badge"),
      updated_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/data/caregivers");
  revalidatePath("/data");
  revalidatePath("/");
  redirect("/data/caregivers");
}

export async function deleteCaregiver(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("caregivers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/data/caregivers");
  revalidatePath("/data");
  revalidatePath("/");
}
