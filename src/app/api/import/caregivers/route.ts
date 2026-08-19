import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getField, parseDateOrNull } from "@/lib/csv-helpers";
import type { Database } from "@/lib/database.types";

import { formatPositionLabel } from "@/lib/report";

type CaregiverInsert = Database["public"]["Tables"]["caregivers"]["Insert"];

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์ CSV" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CaregiverInsert[] = [];
  const skipped: { row: number; reason: string }[] = [];

  parsed.data.forEach((raw, i) => {
    const caregiver_code = getField(raw, "รหัสผู้ดูแล");
    if (!caregiver_code) {
      skipped.push({ row: i + 2, reason: "ไม่มีรหัสผู้ดูแล" });
      return;
    }
    rows.push({
      caregiver_code,
      prefix: getField(raw, "คำนำหน้า") || null,
      full_name: getField(raw, "ชื่อ-นามสกุล") || null,
      phone: getField(raw, "เบอร์โทรศัพท์") || null,
      gender: getField(raw, "เพศ") || null,
      status: getField(raw, "สถานะ") || null,
      registered_date: parseDateOrNull(getField(raw, "วันที่สมัคร")),
      approved_date: parseDateOrNull(getField(raw, "วันที่อนุมัติ")),
      bank_name: getField(raw, "ธนาคาร") || null,
      bank_account_no: getField(raw, "เลขบัญชี") || null,
      position: formatPositionLabel(getField(raw, "ตำแหน่ง")),
      job_type: getField(raw, "ประเภทงาน") || null,
      province: getField(raw, "จังหวัด") || null,
      special_skill: getField(raw, "Special Skill") || null,
      lifestyle: getField(raw, "Lifestyle") || null,
      badge: getField(raw, "Badge") || null,
      updated_date: parseDateOrNull(getField(raw, "วันที่แก้ไขล่าสุด")),
    });
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "ไม่พบแถวที่นำเข้าได้เลย", parseErrors: parsed.errors, skipped },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Upsert keyed on caregiver_code: existing caregivers get refreshed,
  // new codes get inserted, nothing already in the table is ever deleted.
  const { data: existingRows } = await supabase.from("caregivers").select("caregiver_code");
  const existingCodes = new Set((existingRows ?? []).map((r) => r.caregiver_code));
  const added = rows.filter((r) => !existingCodes.has(r.caregiver_code)).length;
  const updated = rows.length - added;

  const batchSize = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("caregivers")
      .upsert(batch, { onConflict: "caregiver_code" });
    if (error) {
      return NextResponse.json(
        { error: error.message, upsertedSoFar: upserted },
        { status: 500 }
      );
    }
    upserted += batch.length;
  }

  return NextResponse.json({
    rowsInFile: parsed.data.length,
    upserted,
    added,
    updated,
    skipped,
    parseErrors: parsed.errors,
  });
}
