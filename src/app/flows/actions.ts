"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
