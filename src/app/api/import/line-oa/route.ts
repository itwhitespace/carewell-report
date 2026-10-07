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
  const rawParse = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  const rawRows = rawParse.data;
  if (!rawRows || rawRows.length === 0) {
    return NextResponse.json(
      { error: "ไฟล์ CSV ว่างเปล่า หรือไม่พบข้อมูล", parseErrors: rawParse.errors },
      { status: 400 }
    );
  }

  const DATE_ALIASES = [
    "date",
    "stat_date",
    "statdate",
    "วันที่",
    "วัน",
    "วัน/เดือน/ปี",
    "time",
    "datetime",
    "date_time",
  ];
  const REACHES_ALIASES = [
    "targetreaches",
    "target_reaches",
    "target reach",
    "target_reach",
    "target reaches",
    "targetreac",
    "target_reac",
    "target reac",
    "reaches",
    "reach",
    "เป้าหมายการส่ง",
    "เพื่อนเป้าหมาย",
    "เป้าหมายการบรอดแคสต์",
    "เป้าหมายบรอดแคสต์",
    "ผู้รับข้อความ",
    "เปิดรับข้อมูล",
    "กลุ่มเป้าหมาย",
    "เป้าหมาย",
  ];
  const BLOCKS_ALIASES = [
    "blocks",
    "block",
    "blocked",
    "บล็อก",
    "ยอดบล็อก",
    "จำนวนบล็อก",
    "การบล็อก",
    "ยอดการบล็อก",
  ];
  const CONTACTS_ALIASES = [
    "contacts",
    "contact",
    "total_friends",
    "total_contacts",
    "friends",
    "friend",
    "followers",
    "follower",
    "เพื่อนทั้งหมด",
    "ยอดผู้ติดตาม",
    "ผู้ติดตามสะสม",
    "เพิ่มเพื่อน",
    "จำนวนเพื่อน",
    "เพื่อนสะสม",
    "จำนวนผู้ติดตาม",
    "ผู้ติดตาม",
    "เพื่อน",
  ];

  const findColumnIndex = (headers: string[], aliases: string[]): number => {
    const cleanedHeaders = headers.map((h) =>
      (h || "").trim().toLowerCase().replace(/[\s_\-#]+/g, "")
    );
    // 1. Exact match
    for (const alias of aliases) {
      const aClean = alias.trim().toLowerCase().replace(/[\s_\-#]+/g, "");
      const idx = cleanedHeaders.findIndex((h) => h === aClean);
      if (idx !== -1) return idx;
    }
    // 2. Substring match
    for (const alias of aliases) {
      const aClean = alias.trim().toLowerCase().replace(/[\s_\-#]+/g, "");
      const idx = cleanedHeaders.findIndex((h) => h.includes(aClean));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Find header row index
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const row = rawRows[i];
    if (
      Array.isArray(row) &&
      row.some(
        (cell) =>
          typeof cell === "string" &&
          DATE_ALIASES.some((a) => cell.toLowerCase().includes(a.toLowerCase()))
      )
    ) {
      headerRowIndex = i;
      break;
    }
  }

  let dateCol = 0;
  let contactsCol = 1;
  let reachesCol = 2;
  let blocksCol = 3;
  let dataStartIndex = 0;

  if (headerRowIndex !== -1) {
    const headers = rawRows[headerRowIndex];
    dateCol = findColumnIndex(headers, DATE_ALIASES);
    contactsCol = findColumnIndex(headers, CONTACTS_ALIASES);
    reachesCol = findColumnIndex(headers, REACHES_ALIASES);
    blocksCol = findColumnIndex(headers, BLOCKS_ALIASES);
    dataStartIndex = headerRowIndex + 1;
  } else {
    // Headerless check: if first cell is a date
    const firstCell = String(rawRows[0]?.[0] ?? "");
    if (parseDateOrNull(firstCell)) {
      dataStartIndex = 0;
      dateCol = 0;
      contactsCol = 1;
      reachesCol = 2;
      blocksCol = 3;
    } else {
      dataStartIndex = 1;
    }
  }

  if (dateCol === -1) {
    dateCol = 0; // fallback to first column
  }

  const rows: LineOaInsert[] = [];
  const skipped: { row: number; reason: string }[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!Array.isArray(row) || row.length === 0 || row.every((c) => !c || !String(c).trim())) {
      continue;
    }

    const dateRaw = String(row[dateCol] ?? "").trim();
    const stat_date = parseDateOrNull(dateRaw);
    if (!stat_date) {
      skipped.push({ row: i + 1, reason: `อ่านวันที่ไม่ได้: "${dateRaw}"` });
      continue;
    }

    const contactsRaw = contactsCol !== -1 ? String(row[contactsCol] ?? "") : "";
    const reachesRaw = reachesCol !== -1 ? String(row[reachesCol] ?? "") : "";
    const blocksRaw = blocksCol !== -1 ? String(row[blocksCol] ?? "") : "";

    rows.push({
      account: account as Account,
      stat_date,
      contacts: parseNumberOrNull(contactsRaw),
      target_reaches: parseNumberOrNull(reachesRaw),
      blocks: parseNumberOrNull(blocksRaw),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "ไม่พบแถวที่นำเข้าได้เลย", parseErrors: rawParse.errors, skipped },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

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
    rowsInFile: rawRows.length - dataStartIndex,
    upserted,
    added,
    updated,
    skipped,
    parseErrors: rawParse.errors,
  });
}
