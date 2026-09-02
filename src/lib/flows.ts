import { getSupabaseAdmin } from "./supabase-admin";
import type { Database } from "./database.types";

export type SystemFlow = Database["public"]["Tables"]["system_flows"]["Row"] & {
  step_count?: number;
  steps?: FlowStep[];
};

export type FlowStep = Database["public"]["Tables"]["flow_steps"]["Row"];

export async function getSystemFlows(): Promise<SystemFlow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: flows, error } = await supabase
      .from("system_flows")
      .select("*, flow_steps(id)")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching system_flows:", error);
      return [];
    }

    return (flows ?? []).map((f) => {
      const { flow_steps, ...rest } = f as unknown as SystemFlow & { flow_steps: { id: string }[] };
      return {
        ...rest,
        step_count: Array.isArray(flow_steps) ? flow_steps.length : 0,
      };
    });
  } catch (err) {
    console.error("Supabase environment or connection error:", err);
    return [];
  }
}

export async function getSystemFlowById(id: string): Promise<SystemFlow | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: flow, error } = await supabase
      .from("system_flows")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !flow) return null;

    const { data: steps } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", id)
      .order("step_number", { ascending: true });

    return {
      ...flow,
      steps: steps ?? [],
      step_count: steps?.length ?? 0,
    };
  } catch (err) {
    console.error("Supabase environment or connection error:", err);
    return null;
  }
}

export async function createSystemFlow(data: {
  title: string;
  description?: string;
  category?: string;
}): Promise<SystemFlow> {
  const supabase = getSupabaseAdmin();
  const { data: created, error } = await supabase
    .from("system_flows")
    .insert({
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? "UI/UX Layout",
    })
    .select()
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create system flow");

  // Create default initial step 1
  await supabase.from("flow_steps").insert({
    flow_id: created.id,
    step_number: 1,
    title: "ขั้นตอนที่ 1: โครงสร้างและแบบร่าง UI/UX Layout",
    content: `### 🎨 ภาพรวมขั้นตอน UI/UX Layout
อธิบายวัตถุประสงค์และการวางเลย์เอาต์ส่วนต่อประสานผู้ใช้ที่นี่...

> [!NOTE]
> สามารถกดปุ่ม **แทรกรูปภาพ** หรือกดวางรูปภาพ (**Ctrl + V**) หรือลากไฟล์รูปภาพมาวางได้โดยตรง!

#### 📌 รายการตรวจสอบดีไซน์ (Design Checklist)
- [ ] ==จัดวางปุ่มและคอมโพเนนต์สำคัญให้อยู่ในตำแหน่งที่มองเห็นง่าย==
- [ ] <span class="blue">ตรวจสอบการแสดงผลบนอุปกรณ์มือถือและหน้าจอเดสก์ท็อป</span>
- [ ] <span class="red">เน้นย้ำจุดที่ผู้ใช้งานต้องกดหรือส่งข้อมูล</span>

> [!TIP]
> สลับไปที่โหมด **อ่านเนื้อหา (Read)** เพื่อดูการแสดงผลเลย์เอาต์หน้าจอที่สะอาดตา
`,
  });

  return created;
}

export async function updateSystemFlow(
  id: string,
  data: { title?: string; description?: string; category?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("system_flows")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteSystemFlow(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("system_flows").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createFlowStep(data: {
  flow_id: string;
  title: string;
  content?: string;
}): Promise<FlowStep> {
  const supabase = getSupabaseAdmin();

  // Find current max step_number
  const { data: existing } = await supabase
    .from("flow_steps")
    .select("step_number")
    .eq("flow_id", data.flow_id)
    .order("step_number", { ascending: false })
    .limit(1);

  const nextStepNum = existing && existing.length > 0 ? existing[0].step_number + 1 : 1;

  const { data: created, error } = await supabase
    .from("flow_steps")
    .insert({
      flow_id: data.flow_id,
      step_number: nextStepNum,
      title: data.title,
      content: data.content ?? "",
    })
    .select()
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create flow step");

  // Update flow updated_at
  await supabase
    .from("system_flows")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.flow_id);

  return created;
}

export async function updateFlowStep(
  id: string,
  data: { title?: string; content?: string; step_number?: number }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: step, error: fetchErr } = await supabase
    .from("flow_steps")
    .select("flow_id")
    .eq("id", id)
    .single();

  if (fetchErr || !step) throw new Error("Flow step not found");

  const { error } = await supabase
    .from("flow_steps")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Touch flow updated_at
  await supabase
    .from("system_flows")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", step.flow_id);
}

export async function deleteFlowStep(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: step } = await supabase
    .from("flow_steps")
    .select("flow_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("flow_steps").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (step) {
    // Re-index step_numbers
    const { data: remaining } = await supabase
      .from("flow_steps")
      .select("id")
      .eq("flow_id", step.flow_id)
      .order("step_number", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("flow_steps")
          .update({ step_number: i + 1 })
          .eq("id", remaining[i].id);
      }
    }
  }
}

export async function reorderFlowSteps(flowId: string, stepIds: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  for (let i = 0; i < stepIds.length; i++) {
    await supabase
      .from("flow_steps")
      .update({ step_number: i + 1, updated_at: new Date().toISOString() })
      .eq("id", stepIds[i]);
  }
  await supabase
    .from("system_flows")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", flowId);
}
