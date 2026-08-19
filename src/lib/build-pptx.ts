import PptxGenJS from "pptxgenjs";
import type { SlideDeckData, AccountDetail, ReportNote } from "@/components/slides/SlideDeck";
import type { PositionMonthStats } from "@/lib/report";

// Plain hex (no '#') mirroring the dark palette in chart-theme.ts — kept as
// a separate constant set here since that module is client-only ("use
// client") and this builder runs server-side.
const C = {
  bg: "0D0D0D",
  surface: "1A1A19",
  textPrimary: "FFFFFF",
  textSecondary: "C3C2B7",
  muted: "898781",
  gridline: "2C2C2A",
  accent: "199E70",
  carewellteam: "3987E5",
  carewell: "D95926",
  statusGood: "0CA30C",
  statusCritical: "D03B3B",
  statusWarning: "FAB219",
};

const ACCOUNT_LABEL: Record<AccountDetail["key"], string> = {
  carewellteam: "CAREWELL TEAM",
  carewell: "CAREWELL",
};

function fmtInt(n: number | null | undefined) {
  return n === null || n === undefined ? "-" : n.toLocaleString();
}

function fmtPct(n: number | null, digits = 2) {
  return n === null ? "-" : `${n.toFixed(digits)}%`;
}

function fmtSigned(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString()}`;
}

const SHORT_THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
function shortMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return `${SHORT_THAI_MONTHS[m - 1]} ${(y + 543) % 100}`;
}

type Slide = InstanceType<typeof PptxGenJS>["addSlide"] extends (...args: never[]) => infer R ? R : never;

function addBackground(slide: Slide) {
  slide.background = { color: C.bg };
}

function addHeader(slide: Slide, eyebrow: string, title: string, subtitle?: string) {
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.5, y: 0.35, w: 9, h: 0.3,
    fontSize: 11, color: C.muted, bold: true, charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.5, y: 0.65, w: 9, h: 0.6,
    fontSize: 24, color: C.textPrimary, bold: true,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 1.15, w: 9, h: 0.35,
      fontSize: 12, color: C.textSecondary,
    });
  }
}

function addStatTiles(
  slide: Slide,
  tiles: { label: string; value: string; delta?: string | null; color: string }[],
  top = 1.7
) {
  const gap = 0.25;
  const w = (9 - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach((t, i) => {
    const x = 0.5 + i * (w + gap);
    slide.addShape("roundRect", {
      x, y: top, w, h: 1.5,
      fill: { color: C.surface },
      line: { color: C.gridline, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText(t.label, { x: x + 0.15, y: top + 0.15, w: w - 0.3, h: 0.35, fontSize: 10, color: C.textSecondary });
    slide.addText(t.value, { x: x + 0.15, y: top + 0.5, w: w - 0.3, h: 0.5, fontSize: 22, bold: true, color: t.color });
    if (t.delta) {
      slide.addText(t.delta, { x: x + 0.15, y: top + 1.0, w: w - 0.3, h: 0.35, fontSize: 9, color: C.statusGood });
    }
  });
}

function addDataTable(
  slide: Slide,
  columns: { label: string; width: number }[],
  rows: (string | number)[][],
  opts: { top?: number; highlightLastRow?: boolean } = {}
) {
  const top = opts.top ?? 1.6;
  const header = columns.map((c) => ({
    text: c.label,
    options: { bold: true, color: C.textPrimary, fill: { color: C.accent }, fontSize: 9 },
  }));
  const body = rows.map((row, ri) => {
    const isLast = opts.highlightLastRow && ri === rows.length - 1;
    return row.map((cell) => ({
      text: String(cell),
      options: {
        color: isLast ? C.textPrimary : C.textSecondary,
        bold: !!isLast,
        fill: { color: isLast ? C.accent : ri % 2 === 1 ? C.surface : C.bg },
        fontSize: 9,
      },
    }));
  });

  slide.addTable([header, ...body], {
    x: 0.5,
    y: top,
    w: 9,
    colW: columns.map((c) => c.width),
    border: { type: "solid", color: C.gridline, pt: 0.5 },
    autoPage: false,
    valign: "middle",
  });
}

function accountSlides(pptx: PptxGenJS, account: AccountDetail) {
  const accent = account.key === "carewellteam" ? C.carewellteam : C.carewell;

  // Section divider
  const divider = pptx.addSlide();
  addBackground(divider);
  divider.addText(ACCOUNT_LABEL[account.key], {
    x: 0, y: 2.3, w: "100%", h: 1,
    align: "center", fontSize: 40, bold: true, color: accent, charSpacing: 3,
  });
  divider.addShape("line", {
    x: 4.2, y: 3.35, w: 1.6, h: 0,
    line: { color: accent, width: 2 },
  });
  divider.addText("LINE OFFICIAL ACCOUNT", {
    x: 0, y: 3.55, w: "100%", h: 0.4,
    align: "center", fontSize: 11, color: C.textSecondary, charSpacing: 2,
  });

  // Overview
  const overview = pptx.addSlide();
  addBackground(overview);
  addHeader(overview, `Line OA — ${account.label}`, "สรุปภาพรวมฐานผู้ติดตาม");
  addStatTiles(overview, [
    { label: "ผู้ติดตามสะสมทั้งหมด (Total)", value: fmtInt(account.contacts), color: C.statusGood },
    { label: "ผู้ติดตามเปิดรับข้อมูล (Reach)", value: fmtInt(account.targetReaches), color: C.statusGood },
    { label: "ยอดการบล็อกสะสม (Blocks)", value: fmtInt(account.blocks), color: C.statusCritical },
  ]);

  // Monthly growth table
  const monthly = pptx.addSlide();
  addBackground(monthly);
  addHeader(monthly, `Line OA — ${account.label}`, "แนวโน้มยอดการเติบโตสะสมรายเดือน");
  addDataTable(
    monthly,
    [
      { label: "เดือน", width: 2 },
      { label: "+New", width: 1.4 },
      { label: "Contacts", width: 1.6 },
      { label: "Target Reaches", width: 1.6 },
      { label: "Blocks", width: 1.2 },
      { label: "Block Rate", width: 1.2 },
    ],
    account.monthly.map((m) => [
      m.monthLabel,
      fmtSigned(m.newFollowers),
      fmtInt(m.contacts),
      fmtInt(m.targetReaches),
      fmtInt(m.blocks),
      fmtPct(m.blockRatePct),
    ])
  );

  // Weekly history table
  const weekly = pptx.addSlide();
  addBackground(weekly);
  addHeader(weekly, `Line OA — ${account.label}`, "ประวัติรายสัปดาห์", "10 สัปดาห์ล่าสุด");
  addDataTable(
    weekly,
    [
      { label: "สัปดาห์ที่", width: 1.2 },
      { label: "ช่วงวันที่", width: 2.6 },
      { label: "ผู้ติดตามสะสม", width: 1.8 },
      { label: "+New", width: 1.4 },
      { label: "สถานะ", width: 2 },
    ],
    account.weekly.slice(-10).map((w) => [w.label, w.rangeLabel, fmtInt(w.cumulative), fmtSigned(w.newCount), w.tierLabel])
  );

  // Channel-funnel table (carewell)
  const funnel = account.channelFunnel;
  if (funnel) {
    const funnelSlide = pptx.addSlide();
    addBackground(funnelSlide);
    addHeader(
      funnelSlide,
      `Line OA — ${account.label}`,
      "ตารางบันทึกสถิติช่องทางลูกค้ารายเดือน",
      "ผู้ติดตาม Line OA, ผู้จองลงทะเบียนบริการ, ปิดการขายสำเร็จ และอัตราการลงทะเบียน"
    );
    const rows: (string | number)[][] = funnel.map((f) => [
      f.monthLabel,
      `${fmtInt(f.friendCount)} คน`,
      `${fmtInt(f.newFriends)} คน`,
      `${fmtInt(f.registerCount)} คน`,
      f.matchingCount > 0 ? `${f.matchingCount} ราย` : "-",
      f.wonCount > 0 ? `${f.wonCount} ราย (Won)` : "0 ราย",
      f.cancelCount > 0 ? String(f.cancelCount) : "-",
      fmtPct(f.registerRatePct, 2),
    ]);
    if (funnel.length > 0) {
      const lastFriend = funnel[funnel.length - 1].friendCount;
      const totalNewFriends = funnel.reduce((s, f) => s + f.newFriends, 0);
      const totalRegister = funnel.reduce((s, f) => s + f.registerCount, 0);
      const totalMatching = funnel.reduce((s, f) => s + f.matchingCount, 0);
      const totalWon = funnel.reduce((s, f) => s + f.wonCount, 0);
      const totalCancel = funnel.reduce((s, f) => s + f.cancelCount, 0);
      const totalRate = totalNewFriends > 0 ? (totalRegister / totalNewFriends) * 100 : null;
      rows.push([
        "ยอดรวมสะสม (Total)",
        `${fmtInt(lastFriend)} คน (สะสมจริง)`,
        "-",
        `${fmtInt(totalRegister)} คน`,
        totalMatching > 0 ? `${totalMatching} ราย` : "-",
        `${fmtInt(totalWon)} ราย (Won)`,
        totalCancel > 0 ? String(totalCancel) : "-",
        fmtPct(totalRate, 2),
      ]);
    }
    addDataTable(
      funnelSlide,
      [
        { label: "เดือน (รอบปี 2569)", width: 1.5 },
        { label: "ผู้ติดตามสะสม", width: 1.3 },
        { label: "ผู้ติดตามเพิ่มรายใหม่", width: 1.4 },
        { label: "จองลงทะเบียนบริการ", width: 1.4 },
        { label: "กำลังจับคู่", width: 1.0 },
        { label: "ปิดการขายสำเร็จ", width: 1.2 },
        { label: "ยกเลิกงาน", width: 0.8 },
        { label: "อัตราการลงทะเบียน", width: 1.1 },
      ],
      rows,
      { top: 1.6, highlightLastRow: funnel.length > 0 }
    );
  }

  // Monthly conversion table (only for accounts without funnel)
  if (!funnel) {
    const convSlide = pptx.addSlide();
    addBackground(convSlide);

    addHeader(
      convSlide,
      `Line OA — ${account.label}`,
      "ตารางวิเคราะห์สัดส่วนผู้ติดตามและผู้สมัครจริงประจำเดือน",
      "เทียบผู้ติดตามใหม่รายเดือนกับจำนวนผู้ดูแลที่ลงทะเบียนจริง (นับรวมทั้งระบบ)"
    );
    const rows = account.conversion.map((c) => [
      c.monthLabel,
      fmtInt(c.newFollowers),
      fmtInt(c.actualRegistrations),
      fmtPct(c.conversionRatePct),
      c.tierLabel,
    ]);
    const totalNew = account.conversion.reduce((s, c) => s + c.newFollowers, 0);
    const totalActual = account.conversion.reduce((s, c) => s + c.actualRegistrations, 0);
    if (account.conversion.length > 0) {
      rows.push([
        "ยอดสะสมรวมทั้งหมด",
        fmtInt(totalNew),
        fmtInt(totalActual),
        fmtPct(totalNew > 0 ? (totalActual / totalNew) * 100 : null),
        "",
      ]);
    }
    addDataTable(
      convSlide,
      [
        { label: "เดือน", width: 2 },
        { label: "New (LINE OA)", width: 2 },
        { label: "สมัครจริง", width: 1.7 },
        { label: "Conversion Rate", width: 1.8 },
        { label: "สถานะ", width: 1.5 },
      ],
      rows,
      { top: 1.9, highlightLastRow: account.conversion.length > 0 }
    );
  }

  // Weekly conversion table (only for accounts without funnel)
  const weeklyConvData = (account.weeklyConversionData ?? []).slice(-10);
  if (!funnel && weeklyConvData.length > 0) {
    const weeklyConvSlide = pptx.addSlide();
    addBackground(weeklyConvSlide);
    addHeader(
      weeklyConvSlide,
      `Line OA — ${account.label}`,
      "ตารางวิเคราะห์สัดส่วนผู้ติดตามและผู้สมัครจริงประจำสัปดาห์",
      "เทียบผู้ติดตามใหม่รายสัปดาห์กับจำนวนผู้ดูแลที่ลงทะเบียนจริงในสัปดาห์นั้นๆ (10 สัปดาห์ล่าสุด)"
    );
    addDataTable(
      weeklyConvSlide,
      [
        { label: "สัปดาห์ / ช่วงวันที่", width: 3 },
        { label: "New (LINE OA)", width: 1.5 },
        { label: "สมัครจริง", width: 1.5 },
        { label: "Conversion Rate", width: 1.5 },
        { label: "สถานะ", width: 1.5 },
      ],
      weeklyConvData.map((w) => [
        `สัปดาห์ที่ ${w.weekNumber} (${w.rangeLabel})`,
        fmtInt(w.newFollowers),
        fmtInt(w.actualRegistrations),
        fmtPct(w.conversionRatePct),
        w.tierLabel,
      ]),
      { top: 1.6 }
    );

    const latestW = weeklyConvData[weeklyConvData.length - 1];
    const posDetails = latestW.caregiverBreakdown.length > 0
      ? latestW.caregiverBreakdown.map((b) => `${b.position}: ${b.count} คน`).join(", ")
      : "ไม่มีผู้สมัครใหม่";

    weeklyConvSlide.addText(
      `📌 สัปดาห์ล่าสุด (สัปดาห์ที่ ${latestW.weekNumber}: ${latestW.rangeLabel}) — มีผู้สมัครใหม่รวม ${latestW.actualRegistrations} คน | คุณวุฒิ/ประเภทบุคลากร: ${posDetails}`,
      { x: 0.5, y: 4.8, w: 9, h: 0.5, fontSize: 10, color: C.accent, bold: true }
    );
  }
}


function positionSlide(pptx: PptxGenJS, stats: PositionMonthStats) {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, "ผู้ดูแลในระบบ", "สถิติผู้สมัครแยกตามประเภทและช่วงเดือน");
  addStatTiles(
    slide,
    [
      { label: "Register", value: fmtInt(stats.registerTotal), color: C.accent },
      { label: "Approve", value: fmtInt(stats.approveTotal), color: C.statusGood },
      { label: "Awaiting approval", value: fmtInt(stats.awaitingTotal), color: C.statusWarning },
    ],
    1.5
  );

  const rows = stats.rows.map((r) => [r.position, ...r.counts.map(fmtInt), fmtInt(r.total)]);
  if (stats.rows.length > 0) {
    const monthTotals = stats.monthKeys.map((_, i) => stats.rows.reduce((s, r) => s + r.counts[i], 0));
    rows.push(["รวมรายเดือนสะสม", ...monthTotals.map(fmtInt), fmtInt(monthTotals.reduce((a, b) => a + b, 0))]);
  }
  const monthColWidth = stats.monthKeys.length > 0 ? 6.5 / stats.monthKeys.length : 1;
  addDataTable(
    slide,
    [
      { label: "ประเภทบุคลากร", width: 2 },
      ...stats.monthLabels.map((l) => ({ label: l, width: monthColWidth })),
      { label: "รวม", width: 0.8 },
    ],
    rows,
    { top: 3.3, highlightLastRow: stats.rows.length > 0 }
  );
}

function notesSlide(pptx: PptxGenJS, notes: ReportNote[]) {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, "CareWell Report", "ประเด็นเพิ่มเติม");
  if (notes.length === 0) {
    slide.addText('ยังไม่มีบันทึกเพิ่มเติม', { x: 0.5, y: 1.7, w: 9, h: 0.4, fontSize: 12, color: C.muted });
    return;
  }
  slide.addText(
    notes.map((n) => ({
      text: `${n.topic}${n.detail ? "\n" + n.detail : ""}`,
      options: { bullet: { code: "25CF" }, breakLine: true, paraSpaceAfter: 12 },
    })),
    {
      x: 0.5, y: 1.7, w: 9, h: 4.5,
      fontSize: 13, color: C.textPrimary, valign: "top",
    }
  );
}

export async function buildPptx(data: SlideDeckData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CAREWELL", width: 10, height: 5.63 });
  pptx.layout = "CAREWELL";

  // Title slide
  const title = pptx.addSlide();
  addBackground(title);
  addHeader(title, "CareWell Report", "ภาพรวมข้อมูล CareWell", data.periodLabel);
  const carewellteam = data.accounts.find((a) => a.key === "carewellteam");
  const carewell = data.accounts.find((a) => a.key === "carewell");
  addStatTiles(title, [
    { label: "ผู้ดูแลที่ลงทะเบียนทั้งหมด", value: data.totalCaregivers.toLocaleString(), color: C.accent },
    {
      label: "ผู้ติดตาม @carewellteam ล่าสุด",
      value: fmtInt(carewellteam?.contacts),
      delta: carewellteam?.deltaAbs != null ? `${fmtSigned(carewellteam.deltaAbs)} คน ตลอดช่วงข้อมูล` : null,
      color: C.carewellteam,
    },
    {
      label: "ผู้ติดตาม @carewell ล่าสุด",
      value: fmtInt(carewell?.contacts),
      delta: carewell?.deltaAbs != null ? `${fmtSigned(carewell.deltaAbs)} คน ตลอดช่วงข้อมูล` : null,
      color: C.carewell,
    },
  ]);

  if (carewellteam) {
    accountSlides(pptx, carewellteam);
    positionSlide(pptx, data.positionStats);
  }
  if (carewell) accountSlides(pptx, carewell);

  notesSlide(pptx, data.notes);

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
