import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  buildGrowthSeries,
  caregiverPositionByMonth,
  latestSnapshot,
  monthlyChannelFunnel,
  monthlyConversion,
  monthlyLineOaStats,
  rankAndFold,
  statusCounts,
  weeklyConversion,
  weeklyLineOaHistory,
  type CaregiverRow,
  type LineOaRow,
  type ServiceRecipientRow,
} from "@/lib/report";
import type { SlideDeckData } from "@/components/slides/SlideDeck";

function formatThaiDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ACCOUNTS: { key: LineOaRow["account"]; label: string }[] = [
  { key: "carewellteam", label: "@carewellteam" },
  { key: "carewell", label: "@carewell" },
];

import { parseNoteDetail } from "@/lib/notes";

export async function loadSlideData(): Promise<SlideDeckData> {
  const supabase = getSupabaseAdmin();

  const [lineOaRes, caregiverRes, notesRes, recipientsRes] = await Promise.all([
    supabase
      .from("line_oa_daily_stats")
      .select("account, stat_date, contacts, target_reaches, blocks")
      .order("stat_date", { ascending: true }),
    supabase
      .from("caregivers")
      .select("status, province, job_type, position, gender, registered_date, approved_date"),
    supabase.from("report_notes").select("topic, detail").order("sort_order").order("created_at"),
    supabase.from("service_recipients").select("service_date, status"),
  ]);

  const lineOaRows = (lineOaRes.data ?? []) as LineOaRow[];
  const caregivers = (caregiverRes.data ?? []) as CaregiverRow[];
  const rawNotes = notesRes.data ?? [];
  const recipients = (recipientsRes.data ?? []) as ServiceRecipientRow[];

  const notes = rawNotes.map((n) => {
    const { status, detail } = parseNoteDetail(n.detail);
    return {
      topic: n.topic,
      detail,
      status,
    };
  });

  const growth = buildGrowthSeries(lineOaRows);

  const periodLabel =
    growth.length > 0
      ? `ข้อมูล Line OA ${formatThaiDate(growth[0].date)} – ${formatThaiDate(growth[growth.length - 1].date)}`
      : "ยังไม่มีข้อมูล — เริ่มนำเข้า CSV ได้ที่เมนู “นำเข้าข้อมูล”";

  const accounts = ACCOUNTS.map(({ key, label }) => ({
    key,
    label,
    ...latestSnapshot(lineOaRows, key),
    monthly: monthlyLineOaStats(lineOaRows, key),
    weekly: weeklyLineOaHistory(lineOaRows, key),
    conversion: monthlyConversion(lineOaRows, key, caregivers),
    weeklyConversionData: weeklyConversion(lineOaRows, key, caregivers),
    // Customer-channel funnel (LINE friends -> service registrations -> won
    // deals) is only requested for the @carewell slide group so far.
    channelFunnel: key === "carewell" ? monthlyChannelFunnel(lineOaRows, key, recipients) : undefined,
  }));

  return {
    totalCaregivers: caregivers.length,
    growth,
    statusData: statusCounts(caregivers.map((c) => c.status)),
    provinceData: rankAndFold(caregivers.map((c) => c.province), 10),
    jobTypeData: rankAndFold(caregivers.map((c) => c.job_type), 8),
    periodLabel,
    accounts,
    positionStats: caregiverPositionByMonth(caregivers),
    notes,
  };
}
