export type LineOaRow = {
  account: "carewellteam" | "carewell";
  stat_date: string;
  contacts: number | null;
  target_reaches: number | null;
  blocks: number | null;
};

export type CaregiverRow = {
  status: string | null;
  province: string | null;
  job_type: string | null;
  position: string | null;
  gender: string | null;
  registered_date: string | null;
  approved_date: string | null;
};

export type GrowthPoint = {
  date: string;
  carewellteam: number | null;
  carewell: number | null;
  carewellteamBlocks: number | null;
  carewellBlocks: number | null;
};

export function buildGrowthSeries(rows: LineOaRow[]): GrowthPoint[] {
  const byDate = new Map<string, GrowthPoint>();
  for (const row of rows) {
    const existing = byDate.get(row.stat_date) ?? {
      date: row.stat_date,
      carewellteam: null,
      carewell: null,
      carewellteamBlocks: null,
      carewellBlocks: null,
    };
    if (row.account === "carewellteam") {
      existing.carewellteam = row.contacts;
      existing.carewellteamBlocks = row.blocks;
    } else {
      existing.carewell = row.contacts;
      existing.carewellBlocks = row.blocks;
    }
    byDate.set(row.stat_date, existing);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type LatestSnapshot = {
  asOfDate: string | null;
  contacts: number | null;
  targetReaches: number | null;
  blocks: number | null;
  reachRatePct: number | null;
  blockRatePct: number | null;
  /** Net new contacts from the first to the last recorded day. Shown as an
   * absolute count, not a percentage — early-days totals often start at 1,
   * which would make any later number read as a meaningless multi-thousand
   * percent jump. */
  deltaAbs: number | null;
};

export function latestSnapshot(
  rows: LineOaRow[],
  account: LineOaRow["account"]
): LatestSnapshot {
  const series = rows
    .filter((r) => r.account === account)
    .sort((a, b) => a.stat_date.localeCompare(b.stat_date));
  const empty: LatestSnapshot = {
    asOfDate: null,
    contacts: null,
    targetReaches: null,
    blocks: null,
    reachRatePct: null,
    blockRatePct: null,
    deltaAbs: null,
  };
  if (series.length === 0) return empty;

  const last = series[series.length - 1];
  const first = series.find((r) => r.contacts !== null);
  const deltaAbs =
    first?.contacts !== undefined && first.contacts !== null && last.contacts !== null
      ? last.contacts - first.contacts
      : null;
  const reachRatePct =
    last.contacts && last.contacts > 0 && last.target_reaches !== null
      ? (last.target_reaches / last.contacts) * 100
      : null;
  const blockRatePct =
    last.contacts && last.contacts > 0 && last.blocks !== null
      ? (last.blocks / last.contacts) * 100
      : null;

  return {
    asOfDate: last.stat_date,
    contacts: last.contacts,
    targetReaches: last.target_reaches,
    blocks: last.blocks,
    reachRatePct,
    blockRatePct,
    deltaAbs,
  };
}

export type RankedItem = { name: string; count: number };

export function rankAndFold(
  values: (string | null)[],
  topN: number,
  otherLabel = "อื่นๆ"
): RankedItem[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const name = raw?.trim() || "ไม่ระบุ";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const sorted = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, item) => sum + item.count, 0);
  return [...top, { name: otherLabel, count: otherCount }];
}

/** Status counts sorted by a fixed, deterministic key (alphabetical) so the
 * same status label always lands in the same chart position across imports. */
export function statusCounts(values: (string | null)[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const name = raw?.trim() || "ไม่ระบุ";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
}

/** Deterministic status -> semantic bucket, shared by the chart color map and
 * the register/approve/awaiting stat tiles so both agree on the same labels. */
export type StatusBucket = "good" | "pending" | "critical" | "neutral";

export function classifyCaregiverStatus(status: string | null): StatusBucket {
  const s = (status ?? "").toLowerCase();
  const negative = ["ไม่อนุมัติ", "ปฏิเสธ", "ยกเลิก", "ระงับ", "reject", "cancel", "block"];
  const pending = ["รอ", "pending", "review"];
  const positive = ["อนุมัติ", "active", "approve", "ผ่าน"];

  if (negative.some((k) => s.includes(k))) return "critical";
  if (pending.some((k) => s.includes(k))) return "pending";
  if (positive.some((k) => s.includes(k))) return "good";
  return "neutral";
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function monthKeyOf(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}

function monthLabelTh(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y}`;
}

function shortDateTh(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
}

function daysInMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export type MonthlyStat = {
  monthKey: string;
  monthLabel: string;
  /** Set when the month's coverage doesn't span the full calendar month. */
  partialRangeLabel: string | null;
  newFollowers: number;
  contacts: number | null;
  targetReaches: number | null;
  blocks: number | null;
  blockRatePct: number | null;
};

/** One row per calendar month: the account's cumulative snapshot as of the
 * last day of data recorded in that month, plus the net new followers vs.
 * the previous month's snapshot. */
export function monthlyLineOaStats(
  rows: LineOaRow[],
  account: LineOaRow["account"]
): MonthlyStat[] {
  const series = rows
    .filter((r) => r.account === account)
    .sort((a, b) => a.stat_date.localeCompare(b.stat_date));

  const lastByMonth = new Map<string, LineOaRow>();
  const firstDayByMonth = new Map<string, string>();
  for (const r of series) {
    const mk = monthKeyOf(r.stat_date);
    lastByMonth.set(mk, r); // series is sorted ascending, so this ends up the latest
    if (!firstDayByMonth.has(mk)) firstDayByMonth.set(mk, r.stat_date);
  }

  const monthKeys = [...lastByMonth.keys()].sort();
  let prevContacts = 0;

  return monthKeys.map((mk) => {
    const rec = lastByMonth.get(mk)!;
    const firstDay = firstDayByMonth.get(mk)!;
    const contacts = rec.contacts;
    const newFollowers = contacts !== null ? contacts - prevContacts : 0;
    if (contacts !== null) prevContacts = contacts;

    const blockRatePct =
      contacts && contacts > 0 && rec.blocks !== null ? (rec.blocks / contacts) * 100 : null;

    const startsOnFirst = Number(firstDay.slice(8, 10)) === 1;
    const endsOnLast = Number(rec.stat_date.slice(8, 10)) === daysInMonth(mk);
    const partialRangeLabel =
      startsOnFirst && endsOnLast
        ? null
        : `สะสม ${shortDateTh(firstDay)} - ${shortDateTh(rec.stat_date)}`;

    return {
      monthKey: mk,
      monthLabel: monthLabelTh(mk),
      partialRangeLabel,
      newFollowers,
      contacts,
      targetReaches: rec.target_reaches,
      blocks: rec.blocks,
      blockRatePct,
    };
  });
}

export type GrowthTier = "stable" | "moderate" | "fast" | "explosive";

const GROWTH_TIER_LABEL: Record<GrowthTier, string> = {
  stable: "Stable",
  moderate: "Moderate Growth",
  fast: "Fast Growth",
  explosive: "Explosive Growth",
};

function classifyGrowthTier(newCount: number): GrowthTier {
  if (newCount < 10) return "stable";
  if (newCount < 25) return "moderate";
  if (newCount < 50) return "fast";
  return "explosive";
}

export type WeeklyStat = {
  weekNumber: number;
  label: string;
  rangeLabel: string;
  cumulative: number | null;
  newCount: number;
  tier: GrowthTier;
  tierLabel: string;
};

/** Fixed 7-day buckets anchored to the first day of data, matching the
 * account's own reporting cadence rather than the ISO calendar week. */
export function weeklyLineOaHistory(
  rows: LineOaRow[],
  account: LineOaRow["account"]
): WeeklyStat[] {
  const series = rows
    .filter((r) => r.account === account && r.contacts !== null)
    .sort((a, b) => a.stat_date.localeCompare(b.stat_date));
  if (series.length === 0) return [];

  const endDate = new Date(series[series.length - 1].stat_date);
  let cursor = new Date(series[0].stat_date);
  let prevCumulative = 0;
  let weekNumber = 1;
  const weeks: WeeklyStat[] = [];

  while (cursor <= endDate) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const isLast = weekEnd >= endDate;
    const rangeEnd = isLast ? endDate : weekEnd;

    const recordsInRange = series.filter((r) => new Date(r.stat_date) <= rangeEnd);
    const rec = recordsInRange[recordsInRange.length - 1];
    const cumulative = rec?.contacts ?? prevCumulative;
    const newCount = cumulative - prevCumulative;
    const tier = classifyGrowthTier(newCount);

    weeks.push({
      weekNumber,
      label: isLast ? "Last" : String(weekNumber),
      rangeLabel: `${shortDateTh(cursor.toISOString().slice(0, 10))} - ${shortDateTh(
        rangeEnd.toISOString().slice(0, 10)
      )}`,
      cumulative,
      newCount,
      tier,
      tierLabel: GROWTH_TIER_LABEL[tier],
    });

    prevCumulative = cumulative;
    if (isLast) break;
    cursor = new Date(rangeEnd);
    cursor.setDate(cursor.getDate() + 1);
    weekNumber++;
  }

  return weeks;
}

export type ConversionTier = "low" | "high" | "exceptional";

const CONVERSION_TIER_LABEL: Record<ConversionTier, string> = {
  low: "Low Conversion",
  high: "High Conversion",
  exceptional: "Exceptional",
};

function classifyConversionTier(ratePct: number | null): ConversionTier {
  if (ratePct === null) return "low";
  if (ratePct >= 25) return "exceptional";
  if (ratePct >= 5) return "high";
  return "low";
}

export type ConversionStat = {
  monthKey: string;
  monthLabel: string;
  newFollowers: number;
  actualRegistrations: number;
  conversionRatePct: number | null;
  tier: ConversionTier;
  tierLabel: string;
};

/** Compares each month's new LINE OA followers against caregivers who
 * registered in the system that same month (system-wide registrations —
 * there's no per-account attribution in the source data). */
export function monthlyConversion(
  lineOaRows: LineOaRow[],
  account: LineOaRow["account"],
  caregivers: CaregiverRow[]
): ConversionStat[] {
  const monthly = monthlyLineOaStats(lineOaRows, account);

  const regByMonth = new Map<string, number>();
  for (const c of caregivers) {
    if (!c.registered_date) continue;
    const mk = monthKeyOf(c.registered_date);
    regByMonth.set(mk, (regByMonth.get(mk) ?? 0) + 1);
  }

  return monthly.map((m) => {
    const actualRegistrations = regByMonth.get(m.monthKey) ?? 0;
    const conversionRatePct =
      m.newFollowers > 0 ? (actualRegistrations / m.newFollowers) * 100 : null;
    const tier = classifyConversionTier(conversionRatePct);
    return {
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      newFollowers: m.newFollowers,
      actualRegistrations,
      conversionRatePct,
      tier,
      tierLabel: CONVERSION_TIER_LABEL[tier],
    };
  });
}

export type WeeklyConversionStat = {
  weekNumber: number;
  label: string;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  newFollowers: number;
  actualRegistrations: number;
  conversionRatePct: number | null;
  tier: ConversionTier;
  tierLabel: string;
  caregiverBreakdown: { position: string; count: number }[];
};

export function formatPositionLabel(raw: string | null | undefined): string {
  if (!raw) return "ไม่ระบุ";
  const s = raw.trim();
  if (!s) return "ไม่ระบุ";

  const lower = s.toLowerCase();
  if (lower.includes("พยาบาลวิชาชีพ") || lower === "rn" || lower.includes("(rn)")) {
    return "พยาบาลวิชาชีพ (RN)";
  }
  if (lower.includes("ผู้ช่วยพยาบาล") || lower === "pn" || lower.includes("(pn)")) {
    return "ผู้ช่วยพยาบาล (PN)";
  }
  if (lower.includes("พนักงานช่วยการพยาบาล") || lower === "na" || lower.includes("(na)")) {
    return "พนักงานช่วยการพยาบาล (NA)";
  }
  if (lower.includes("ผู้ดูแลผู้ป่วย") || lower.includes("ผู้ดูแล") || lower === "cg" || lower.includes("(cg)")) {
    return "ผู้ดูแลผู้ป่วย (CG)";
  }

  return s;
}

/** Compares each week's new LINE OA followers against caregivers who
 * registered in the system during that same 7-day period. Includes breakdown
 * by position/qualification for each week. */
export function weeklyConversion(
  rows: LineOaRow[],
  account: LineOaRow["account"],
  caregivers: CaregiverRow[]
): WeeklyConversionStat[] {
  const series = rows
    .filter((r) => r.account === account && r.contacts !== null)
    .sort((a, b) => a.stat_date.localeCompare(b.stat_date));
  if (series.length === 0) return [];

  const endDate = new Date(series[series.length - 1].stat_date);
  let cursor = new Date(series[0].stat_date);
  let prevCumulative = 0;
  let weekNumber = 1;
  const weeks: WeeklyConversionStat[] = [];

  while (cursor <= endDate) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const isLast = weekEnd >= endDate;
    const rangeEnd = isLast ? endDate : weekEnd;

    const startDateIso = cursor.toISOString().slice(0, 10);
    const endDateIso = rangeEnd.toISOString().slice(0, 10);

    const recordsInRange = series.filter((r) => new Date(r.stat_date) <= rangeEnd);
    const rec = recordsInRange[recordsInRange.length - 1];
    const cumulative = rec?.contacts ?? prevCumulative;
    const newFollowers = cumulative - prevCumulative;

    const regsInWeek = caregivers.filter((c) => {
      if (!c.registered_date) return false;
      return c.registered_date >= startDateIso && c.registered_date <= endDateIso;
    });

    const actualRegistrations = regsInWeek.length;
    const conversionRatePct =
      newFollowers > 0 ? (actualRegistrations / newFollowers) * 100 : null;
    const tier = classifyConversionTier(conversionRatePct);

    const posCounts = new Map<string, number>();
    for (const c of regsInWeek) {
      const pos = formatPositionLabel(c.position);
      posCounts.set(pos, (posCounts.get(pos) ?? 0) + 1);
    }
    const caregiverBreakdown = [...posCounts.entries()]
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);


    weeks.push({
      weekNumber,
      label: isLast ? "Last" : String(weekNumber),
      rangeLabel: `${shortDateTh(startDateIso)} - ${shortDateTh(endDateIso)}`,
      startDate: startDateIso,
      endDate: endDateIso,
      newFollowers,
      actualRegistrations,
      conversionRatePct,
      tier,
      tierLabel: CONVERSION_TIER_LABEL[tier],
      caregiverBreakdown,
    });

    prevCumulative = cumulative;
    if (isLast) break;
    cursor = new Date(rangeEnd);
    cursor.setDate(cursor.getDate() + 1);
    weekNumber++;
  }

  return weeks;
}


export type ServiceRecipientRow = {
  service_date: string | null;
  status: string | null;
};

export type ChannelFunnelStat = {
  monthKey: string;
  monthLabel: string;
  friendCount: number | null;
  newFriends: number;
  registerCount: number;
  wonCount: number;
  registerRatePct: number | null;
};

/** Monthly funnel for one LINE OA account: friends gained -> service
 * recipients registered -> deals won. `service_recipients` has no
 * per-account channel field in the source data, so — like
 * `monthlyConversion` — registrations are counted system-wide, not
 * attributed to this specific account. */
export function monthlyChannelFunnel(
  lineOaRows: LineOaRow[],
  account: LineOaRow["account"],
  recipients: ServiceRecipientRow[]
): ChannelFunnelStat[] {
  const monthly = monthlyLineOaStats(lineOaRows, account);

  const registerByMonth = new Map<string, number>();
  const wonByMonth = new Map<string, number>();
  for (const r of recipients) {
    if (!r.service_date) continue;
    const mk = monthKeyOf(r.service_date);
    registerByMonth.set(mk, (registerByMonth.get(mk) ?? 0) + 1);
    if ((r.status ?? "").trim().toLowerCase() === "won") {
      wonByMonth.set(mk, (wonByMonth.get(mk) ?? 0) + 1);
    }
  }

  return monthly.map((m) => {
    const registerCount = registerByMonth.get(m.monthKey) ?? 0;
    const wonCount = wonByMonth.get(m.monthKey) ?? 0;
    const registerRatePct = m.newFollowers > 0 ? (registerCount / m.newFollowers) * 100 : null;
    return {
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      friendCount: m.contacts,
      newFriends: m.newFollowers,
      registerCount,
      wonCount,
      registerRatePct,
    };
  });
}

export type PositionMonthStats = {
  registerTotal: number;
  approveTotal: number;
  awaitingTotal: number;
  monthKeys: string[];
  monthLabels: string[];
  rows: { position: string; counts: number[]; total: number }[];
};

/** Registration counts by position (RN / PN / NA / CG, or whatever the source
 * data uses), broken down by the month each caregiver registered. */
export function caregiverPositionByMonth(caregivers: CaregiverRow[]): PositionMonthStats {
  const monthKeySet = new Set<string>();
  const byPosition = new Map<string, Map<string, number>>();
  let registerTotal = 0;
  let approveTotal = 0;
  let awaitingTotal = 0;

  for (const c of caregivers) {
    registerTotal++;
    // Approve/Awaiting is defined by whether an approval date has been
    // recorded, not by the free-text status label.
    if (c.approved_date) approveTotal++;
    else awaitingTotal++;

    if (!c.registered_date) continue;
    const mk = monthKeyOf(c.registered_date);
    monthKeySet.add(mk);
    const position = formatPositionLabel(c.position);
    if (!byPosition.has(position)) byPosition.set(position, new Map());
    const inner = byPosition.get(position)!;
    inner.set(mk, (inner.get(mk) ?? 0) + 1);
  }

  const monthKeys = [...monthKeySet].sort();
  const rows = [...byPosition.entries()]
    .map(([position, inner]) => {
      const counts = monthKeys.map((mk) => inner.get(mk) ?? 0);
      return { position, counts, total: counts.reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.total - a.total);

  return {
    registerTotal,
    approveTotal,
    awaitingTotal,
    monthKeys,
    monthLabels: monthKeys.map(monthLabelTh),
    rows,
  };
}
