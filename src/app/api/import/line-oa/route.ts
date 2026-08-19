import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getField, parseDateOrNull, parseNumberOrNull } from "@/lib/csv-helpers";
import type { Database } from "@/lib/database.types";

type LineOaInsert = Database["public"]["Tables"]["line_oa_daily_stats"]["Insert"];

const VALID_ACCOUNTS = ["carewellteam", "carewell"] as const;
type Account = (typeof VALID_ACCOUNTS)[number];

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  const account = formData.get("account");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์ CSV" }, { status: 400 });
  }
  if (typeof account !== "string" || !VALID_ACCOUNTS.includes(account as Account)) {
    return NextResponse.json({ error: "account ต้องเป็น carewellteam หรือ carewell" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: LineOaInsert[] = [];
  const skipped: { row: number; reason: string }[] = [];

  parsed.data.forEach((raw, i) => {
    const dateRaw = getField(raw, "date");
    const stat_date = parseDateOrNull(dateRaw);
    if (!stat_date) {
      skipped.push({ row: i + 2, reason: `อ่านวันที่ไม่ได้: "${dateRaw}"` });
      return;
    }
    rows.push({
      account: account as Account,
      stat_date,
      contacts: parseNumberOrNull(getField(raw, "contacts")),
      target_reaches: parseNumberOrNull(getField(raw, "targetReaches", "target_reaches")),
      blocks: parseNumberOrNull(getField(raw, "blocks")),
    });
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "ไม่พบแถวที่นำเข้าได้เลย", parseErrors: parsed.errors, skipped },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // This is always an upsert keyed on (account, stat_date): dates already in
  // the table get their contacts/reaches/blocks refreshed, dates not seen
  // before get inserted, and nothing is ever deleted — importing a new
  // export just extends the table with whatever's new.
  const { data: existingRows } = await supabase
    .from("line_oa_daily_stats")
    .select("stat_date")
    .eq("account", account as Account);
  const existingDates = new Set((existingRows ?? []).map((r) => r.stat_date));
  const added = rows.filter((r) => !existingDates.has(r.stat_date)).length;
  const updated = rows.length - added;

  const batchSize = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("line_oa_daily_stats")
      .upsert(batch, { onConflict: "account,stat_date" });
    if (error) {
      return NextResponse.json(
        { error: error.message, upsertedSoFar: upserted },
        { status: 500 }
      );
    }
    upserted += batch.length;
  }

  return NextResponse.json({
    account,
    rowsInFile: parsed.data.length,
    upserted,
    added,
    updated,
    skipped,
    parseErrors: parsed.errors,
  });
}
