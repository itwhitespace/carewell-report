"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  createFlowStep,
  createSystemFlow,
  deleteFlowStep,
  deleteSystemFlow,
  reorderFlowSteps,
  updateFlowStep,
  updateSystemFlow,
} from "@/lib/flows";

export async function createFlowAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();

  if (!title) {
    throw new Error("กรุณากรอกชื่อ Flow");
  }

  const created = await createSystemFlow({
    title,
    description: description || undefined,
    category: category || "General",
  });

  revalidatePath("/flows");
  redirect(`/flows/${created.id}`);
}

export async function updateFlowAction(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();

  await updateSystemFlow(id, {
    title: title || undefined,
    description: description || undefined,
    category: category || undefined,
  });

  revalidatePath(`/flows/${id}`);
  revalidatePath("/flows");
}

export async function deleteFlowAction(id: string) {
  await deleteSystemFlow(id);
  revalidatePath("/flows");
  redirect("/flows");
}

export async function createStepAction(flowId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "ขั้นตอนใหม่";
  const content = String(formData.get("content") ?? "").trim();

  const newStep = await createFlowStep({
    flow_id: flowId,
    title,
    content,
  });

  revalidatePath(`/flows/${flowId}`);
  return newStep;
}

export async function updateStepAction(
  stepId: string,
  data: { title?: string; content?: string; step_number?: number }
) {
  await updateFlowStep(stepId, data);
}

export async function deleteStepAction(stepId: string, flowId: string) {
  await deleteFlowStep(stepId);
  revalidatePath(`/flows/${flowId}`);
}

export async function reorderStepsAction(flowId: string, stepIds: string[]) {
  await reorderFlowSteps(flowId, stepIds);
  revalidatePath(`/flows/${flowId}`);
}

export async function uploadFlowImageAction(formData: FormData): Promise<string> {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("ไม่พบไฟล์รูปภาพ");
  }

  const supabase = getSupabaseAdmin();
  const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
  const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const fileName = `img_${Date.now()}_${cleanName}.${fileExt}`;

  // Try uploading to 'flow-images' storage bucket
  const { data, error } = await supabase.storage
    .from("flow-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.warn("Storage upload notice (creating bucket):", error.message);
    try {
      await supabase.storage.createBucket("flow-images", { public: true });
    } catch (bErr) {
      console.warn("Bucket creation notice:", bErr);
    }
    
    // Retry upload after creating bucket
    const { error: retryErr } = await supabase.storage
      .from("flow-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (retryErr) {
      console.error("Failed to upload image to Supabase storage:", retryErr);
      throw retryErr;
    }
  }

  const { data: publicUrlData } = supabase.storage
    .from("flow-images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function deleteFlowImageAction(imageUrl: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const match = imageUrl.match(/\/storage\/v1\/object\/public\/flow-images\/(.+)$/);
    if (!match) return false;

    const fileName = match[1];
    const { error } = await supabase.storage
      .from("flow-images")
      .remove([fileName]);

    if (error) {
      console.error("Failed to delete image from storage:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteFlowImageAction error:", err);
    return false;
  }
}

export async function listFlowImagesAction() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from("flow-images")
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error || !data) return [];

    return data.map((item) => {
      const { data: urlData } = supabase.storage
        .from("flow-images")
        .getPublicUrl(item.name);
      return {
        name: item.name,
        size: item.metadata?.size ?? 0,
        createdAt: item.created_at,
        url: urlData.publicUrl,
      };
    });
  } catch (err) {
    console.error("listFlowImagesAction error:", err);
    return [];
  }
}
