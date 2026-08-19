"use client";

import Link from "next/link";
import { Download, Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  ChannelFunnelStat,
  ConversionStat,
  GrowthPoint,
  LineOaRow,
  MonthlyStat,
  PositionMonthStats,
  RankedItem,
  WeeklyConversionStat,
  WeeklyStat,
} from "@/lib/report";
import { conversionTierStyle, growthTierStyle, useChartPalette, type ChartPalette } from "@/lib/chart-theme";
import { StatTile } from "./StatTile";
import { DataTable, type Column } from "./DataTable";
import { Tag } from "./Tag";
import { AuroraBackground } from "@/components/ui/aurora-background";

export type AccountDetail = {
  key: LineOaRow["account"];
  label: string;
  asOfDate: string | null;
  contacts: number | null;
  targetReaches: number | null;
  blocks: number | null;
  reachRatePct: number | null;
  blockRatePct: number | null;
  deltaAbs: number | null;
  monthly: MonthlyStat[];
  weekly: WeeklyStat[];
  conversion: ConversionStat[];
  weeklyConversionData?: WeeklyConversionStat[];
  channelFunnel?: ChannelFunnelStat[];
};


export type ReportNote = { topic: string; detail: string | null };

export type SlideDeckData = {
  totalCaregivers: number;
  growth: GrowthPoint[];
  statusData: RankedItem[];
  provinceData: RankedItem[];
  jobTypeData: RankedItem[];
  periodLabel: string;
  accounts: AccountDetail[];
  positionStats: PositionMonthStats;
  notes: ReportNote[];
};

const ACCOUNT_DIVIDER_LABEL: Record<LineOaRow["account"], string> = {
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

/** "2026-07" -> "ก.ค. 69" — compact Thai month + 2-digit Buddhist year, for
 * tables with too many columns to spare a full "กรกฎาคม 2026" label. */
function shortMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const beYear = (y + 543) % 100;
  return `${SHORT_THAI_MONTHS[m - 1]} ${beYear}`;
}

function fmtDelta(n: number | null) {
  if (n === null) return null;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString()} คน ตลอดช่วงข้อมูล`;
}

function Slide({
  eyebrow,
  title,
  subtitle,
  center = true,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  children: React.ReactNode;
}) {
  const palette = useChartPalette();
  return (
    <div
      className={`mx-auto flex h-full w-full max-w-[1400px] flex-col px-10 py-12 lg:px-16 ${
        center ? "justify-center" : "justify-start"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: palette.muted }}>
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: palette.textPrimary }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
          {subtitle}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** Full-bleed section-break slide: big Latin wordmark, thin accent rule,
 * atmospheric glow tinted to the section's own identity color. */
function SectionDivider({
  label,
  sublabel,
  accent,
}: {
  label: string;
  sublabel?: string;
  accent: string;
}) {
  const palette = useChartPalette();
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{
        background: `radial-gradient(60% 50% at 50% 45%, ${accent}22, transparent 70%)`,
      }}
    >
      <span
        className="font-[family-name:var(--font-display)] text-6xl font-extrabold tracking-wide uppercase sm:text-7xl lg:text-8xl"
        style={{ color: accent, textShadow: `0 0 60px ${accent}55` }}
      >
        {label}
      </span>
      <span className="mt-7 h-[3px] w-28 rounded-full" style={{ backgroundColor: accent }} />
      {sublabel && (
        <span
          className="mt-7 text-sm font-medium tracking-[0.3em] uppercase"
          style={{ color: palette.textSecondary }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

function AccountOverviewSlides(account: AccountDetail, palette: ChartPalette) {
  const asOfLabel = account.asOfDate
    ? `สะสมจริงนับจากวันเปิดบัญชีถึงวันที่ ${new Date(account.asOfDate).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      })}`
    : null;
  const accentColor = account.key === "carewellteam" ? palette.carewellteam : palette.carewell;

  const monthlyColumns: Column[] = [
    { key: "month", label: "เดือน" },
    { key: "new", label: "ผู้ติดตามใหม่ (+New)", align: "right" },
    { key: "contacts", label: "ผู้ติดตามสะสม (Contacts)", align: "right" },
    { key: "reaches", label: "เปิดรับข้อมูลจริง (Target Reaches)", align: "right" },
    { key: "blocks", label: "ยอดบล็อกสะสม (Blocks)", align: "right" },
    { key: "blockRate", label: "อัตราการบล็อก (Block Rate)", align: "right" },
  ];
  const monthlyRows = account.monthly.map((m) => ({
    month: (
      <span>
        {m.monthLabel}
        {m.partialRangeLabel && (
          <span className="ml-1 text-xs" style={{ color: palette.muted }}>
            ({m.partialRangeLabel})
          </span>
        )}
      </span>
    ),
    new: (
      <span style={{ color: m.newFollowers >= 0 ? palette.statusGood : palette.statusCritical, fontWeight: 600 }}>
        {fmtSigned(m.newFollowers)} คน
      </span>
    ),
    contacts: `${fmtInt(m.contacts)} คน`,
    reaches: `${fmtInt(m.targetReaches)} คน`,
    blocks: `${fmtInt(m.blocks)} คน`,
    blockRate: fmtPct(m.blockRatePct),
  }));

  const weeklyColumns: Column[] = [
    { key: "week", label: "สัปดาห์ที่" },
    { key: "range", label: "ช่วงวันที่" },
    { key: "cumulative", label: "ผู้ติดตามสะสม", align: "right" },
    { key: "new", label: "เพิ่มใหม่ (+New)", align: "right" },
    { key: "status", label: "สถานะ" },
  ];
  const weeklyRows = account.weekly.slice(-10).map((w) => {
    const tier = growthTierStyle(w.tier, palette);
    return {
      week: (
        <span style={{ fontWeight: w.label === "Last" ? 700 : 400, color: w.label === "Last" ? palette.accent : undefined }}>
          {w.label}
        </span>
      ),
      range: w.rangeLabel,
      cumulative: `${fmtInt(w.cumulative)} คน`,
      new: (
        <span style={{ color: palette.statusGood, fontWeight: 600 }}>{fmtSigned(w.newCount)}</span>
      ),
      status: <Tag label={w.tierLabel} bg={tier.bg} fg={tier.fg} />,
    };
  });

  const conversionColumns: Column[] = [
    { key: "month", label: "เดือน / ช่วงเวลา" },
    { key: "new", label: "ผู้ติดตามใหม่จาก LINE OA (คน)", align: "right" },
    { key: "actual", label: "จำนวนผู้สมัครจริง (คน)", align: "right" },
    { key: "rate", label: "อัตราการสมัคร (Conversion Rate)", align: "right" },
    { key: "status", label: "สถานะประสิทธิภาพ" },
  ];
  const conversionRows = account.conversion.map((c) => {
    const tier = conversionTierStyle(c.tier, palette);
    return {
      month: c.monthLabel,
      new: `${fmtInt(c.newFollowers)} คน`,
      actual: `${fmtInt(c.actualRegistrations)} คน`,
      rate: fmtPct(c.conversionRatePct, 2),
      status: <Tag label={c.tierLabel} bg={tier.bg} fg={tier.fg} />,
    };
  });
  const totalNew = account.conversion.reduce((s, c) => s + c.newFollowers, 0);
  const totalActual = account.conversion.reduce((s, c) => s + c.actualRegistrations, 0);
  const totalRate = totalNew > 0 ? (totalActual / totalNew) * 100 : null;
  if (account.conversion.length > 0) {
    conversionRows.push({
      month: "ยอดสะสมรวมทั้งหมด",
      new: `${fmtInt(totalNew)} คน`,
      actual: `${fmtInt(totalActual)} คน`,
      rate: fmtPct(totalRate, 2),
      status: <></>,
    });
  }

  const funnel = account.channelFunnel;

  const funnelColumns: Column[] = [
    {
      key: "month",
      label: (
        <div>
          เดือน
          <br />
          <span className="text-[10px] font-normal opacity-85">(รอบปี 2569)</span>
        </div>
      ),
    },
    {
      key: "friends",
      label: (
        <div>
          ผู้ติดตามสะสม
          <br />
          <span className="text-[10px] font-normal opacity-85">(Friend Count)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "newFriends",
      label: (
        <div>
          ผู้ติดตามเพิ่มรายใหม่
          <br />
          <span className="text-[10px] font-normal opacity-85">(Leads/New Friends)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "register",
      label: (
        <div>
          จองลงทะเบียนบริการ
          <br />
          <span className="text-[10px] font-normal opacity-85">(Register)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "matching",
      label: (
        <div>
          กำลังจับคู่
          <br />
          <span className="text-[10px] font-normal opacity-85">(Matching)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "won",
      label: (
        <div>
          ปิดการขายสำเร็จ
          <br />
          <span className="text-[10px] font-normal opacity-85">(Won Deals)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "cancel",
      label: (
        <div>
          ยกเลิกงาน
          <br />
          <span className="text-[10px] font-normal opacity-85">(Cancel)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "rate",
      label: (
        <div>
          อัตราการลงทะเบียน
          <br />
          <span className="text-[10px] font-normal opacity-85">(Register Rate)</span>
        </div>
      ),
      align: "right",
    },
  ];

  const funnelRows: Record<string, React.ReactNode>[] = (funnel ?? []).map((f) => ({
    month: f.monthLabel,
    friends: `${fmtInt(f.friendCount)} คน`,
    newFriends: `${fmtInt(f.newFriends)} คน`,
    register: (
      <span style={{ color: f.registerCount > 0 ? palette.statusGood : undefined, fontWeight: f.registerCount > 0 ? 600 : 400 }}>
        {f.registerCount} คน
      </span>
    ),
    matching: (
      <span style={{ color: f.matchingCount > 0 ? "#F59E0B" : undefined, fontWeight: f.matchingCount > 0 ? 600 : 400 }}>
        {f.matchingCount > 0 ? `${f.matchingCount} ราย` : "-"}
      </span>
    ),
    won: (
      <span style={{ color: f.wonCount > 0 ? "#F87171" : undefined, fontWeight: f.wonCount > 0 ? 600 : 400 }}>
        {f.wonCount > 0 ? `${f.wonCount} ราย (Won)` : "0 ราย"}
      </span>
    ),
    cancel: f.cancelCount > 0 ? String(f.cancelCount) : "-",
    rate: (
      <span style={{ color: palette.statusGood, fontWeight: 600 }}>
        {fmtPct(f.registerRatePct, 2)}
      </span>
    ),
  }));

  if (funnel && funnel.length > 0) {
    const lastFriend = funnel[funnel.length - 1].friendCount;
    const totalNewFriends = funnel.reduce((s, f) => s + f.newFriends, 0);
    const totalRegister = funnel.reduce((s, f) => s + f.registerCount, 0);
    const totalMatching = funnel.reduce((s, f) => s + f.matchingCount, 0);
    const totalWon = funnel.reduce((s, f) => s + f.wonCount, 0);
    const totalCancel = funnel.reduce((s, f) => s + f.cancelCount, 0);
    const totalRate = totalNewFriends > 0 ? (totalRegister / totalNewFriends) * 100 : null;

    funnelRows.push({
      month: <b>ยอดรวมสะสม (Total)</b>,
      friends: <b>{fmtInt(lastFriend)} คน (สะสมจริง)</b>,
      newFriends: "-",
      register: <b>{fmtInt(totalRegister)} คน</b>,
      matching: <b>{totalMatching > 0 ? `${totalMatching} ราย` : "-"}</b>,
      won: <b>{fmtInt(totalWon)} ราย (Won)</b>,
      cancel: <b>{totalCancel > 0 ? totalCancel : "-"}</b>,
      rate: <b>{fmtPct(totalRate, 2)}</b>,
    });
  }

  const weeklyConvColumns: Column[] = [
    { key: "week", label: "สัปดาห์ / ช่วงวันที่" },
    { key: "new", label: "ผู้ติดตามใหม่จาก LINE OA (คน)", align: "right" },
    { key: "actual", label: "จำนวนผู้สมัครจริง (คน)", align: "right" },
    { key: "rate", label: "อัตราการสมัคร (Conversion Rate)", align: "right" },
    { key: "status", label: "สถานะประสิทธิภาพ" },
  ];

  const recentWeeklyConv = (account.weeklyConversionData ?? []).slice(-10);
  const weeklyConvRows = recentWeeklyConv.map((w) => {
    const tier = conversionTierStyle(w.tier, palette);
    return {
      week: (
        <span style={{ fontWeight: w.label === "Last" ? 700 : 400 }}>
          สัปดาห์ที่ {w.weekNumber} ({w.rangeLabel})
        </span>
      ),
      new: `${fmtInt(w.newFollowers)} คน`,
      actual: `${fmtInt(w.actualRegistrations)} คน`,
      rate: fmtPct(w.conversionRatePct, 2),
      status: <Tag label={w.tierLabel} bg={tier.bg} fg={tier.fg} />,
    };
  });

  const latestWeeklyConv = recentWeeklyConv.length > 0 ? recentWeeklyConv[recentWeeklyConv.length - 1] : null;

  return [
    <div key={`${account.key}-divider`} className="h-full">
      <SectionDivider label={ACCOUNT_DIVIDER_LABEL[account.key]} sublabel="Line Official Account" accent={accentColor} />
    </div>,

    <Slide key={`${account.key}-overview`} eyebrow={`Line OA — ${account.label}`} title="สรุปภาพรวมฐานผู้ติดตาม" subtitle={asOfLabel ?? undefined}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="ผู้ติดตามสะสมทั้งหมด (Total)" value={fmtInt(account.contacts)} accent={palette.statusGood} glow="green" />
        <StatTile label="ผู้ติดตามเปิดรับข้อมูล (Reach)" value={fmtInt(account.targetReaches)} accent={palette.statusGood} delta={account.reachRatePct !== null ? `กลุ่มเป้าหมายคุณภาพ (${fmtPct(account.reachRatePct)})` : null} glow="green" />
        <StatTile label="ยอดการบล็อกสะสม (Blocks)" value={fmtInt(account.blocks)} accent={palette.statusCritical} delta={account.blockRatePct !== null ? `อัตราการบล็อก (${fmtPct(account.blockRatePct)})` : null} glow="red" />
      </div>
    </Slide>,

    <Slide key={`${account.key}-monthly`} eyebrow={`Line OA — ${account.label}`} title="แนวโน้มยอดการเติบโตสะสมรายเดือน">
      <DataTable columns={monthlyColumns} rows={monthlyRows} />
    </Slide>,

    <Slide key={`${account.key}-weekly`} eyebrow={`Line OA — ${account.label}`} title="ประวัติรายสัปดาห์" subtitle="10 สัปดาห์ล่าสุด">
      <DataTable columns={weeklyColumns} rows={weeklyRows} />
    </Slide>,

    ...(funnel
      ? [
          <Slide
            key={`${account.key}-funnel`}
            eyebrow={`Line OA — ${account.label}`}
            title="ตารางบันทึกสถิติช่องทางลูกค้ารายเดือน"
            subtitle="ผู้ติดตาม Line OA, ผู้จองลงทะเบียนบริการ, ปิดการขายสำเร็จ และอัตราการลงทะเบียน"
          >
            <DataTable columns={funnelColumns} rows={funnelRows} highlightLastRow={funnelRows.length > 0} />
          </Slide>,
        ]
      : []),

    ...(!funnel
      ? [
          <Slide
            key={`${account.key}-conversion`}
            eyebrow={`Line OA — ${account.label}`}
            title="ตารางวิเคราะห์สัดส่วนผู้ติดตามและผู้สมัครจริงประจำเดือน"
            subtitle="เทียบผู้ติดตามใหม่รายเดือนกับจำนวนผู้ดูแลที่ลงทะเบียนจริง (นับรวมทั้งระบบ)"
          >
            <DataTable columns={conversionColumns} rows={conversionRows} highlightLastRow={account.conversion.length > 0} />
          </Slide>,
        ]
      : []),

    ...(!funnel
      ? [
          <Slide
            key={`${account.key}-weekly-conversion`}
            eyebrow={`Line OA — ${account.label}`}
            title="ตารางวิเคราะห์สัดส่วนผู้ติดตามและผู้สมัครจริงประจำสัปดาห์"
            subtitle="เทียบผู้ติดตามใหม่รายสัปดาห์กับจำนวนผู้ดูแลที่ลงทะเบียนจริงในสัปดาห์นั้นๆ (10 สัปดาห์ล่าสุด)"
          >
            <DataTable columns={weeklyConvColumns} rows={weeklyConvRows} />
            {latestWeeklyConv && (
              <div
                className="mt-6 rounded-2xl border p-5 backdrop-blur-sm shadow-lg"
                style={{ borderColor: `${palette.accent}66`, backgroundColor: `${palette.surface}ee` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-bold" style={{ color: palette.textPrimary }}>
                    📌 รายละเอียดผู้สมัครใหม่ในสัปดาห์ล่าสุด (สัปดาห์ที่ {latestWeeklyConv.weekNumber}: {latestWeeklyConv.rangeLabel})
                  </h3>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${palette.accent}33`, color: palette.accent }}
                  >
                    ผู้สมัครใหม่รวม: {latestWeeklyConv.actualRegistrations} คน
                  </span>
                </div>

                {latestWeeklyConv.caregiverBreakdown.length === 0 ? (
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>
                    ในสัปดาห์ล่าสุดยังไม่มีผู้สมัครใหม่ในระบบ
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                      ประเภทบุคลากร / คุณวุฒิที่สมัครเข้ามา:
                    </span>
                    {latestWeeklyConv.caregiverBreakdown.map((b) => (
                      <span
                        key={b.position}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium"
                        style={{
                          borderColor: palette.gridline,
                          backgroundColor: palette.pagePlane,
                          color: palette.textPrimary,
                        }}
                      >
                        <span className="font-semibold" style={{ color: palette.accent }}>{b.position}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-bold"
                          style={{ backgroundColor: `${palette.accent}22`, color: palette.statusGood }}
                        >
                          {b.count} คน
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Slide>,
        ]
      : []),
  ];
}


function PositionMonthSlide(stats: PositionMonthStats, palette: ChartPalette) {
  const columns: Column[] = [
    { key: "position", label: "ประเภทบุคลากร / คุณวุฒิ" },
    ...stats.monthKeys.map((mk, i) => ({ key: `m${i}`, label: `เดือน${stats.monthLabels[i]} (คน)`, align: "right" as const })),
    { key: "total", label: "ยอดรวมสะสม (คน)", align: "right" as const },
  ];

  const rows = stats.rows.map((r) => {
    const row: Record<string, React.ReactNode> = { position: r.position, total: <b>{fmtInt(r.total)}</b> };
    r.counts.forEach((c, i) => (row[`m${i}`] = fmtInt(c)));
    return row;
  });

  if (stats.rows.length > 0) {
    const monthTotals = stats.monthKeys.map((_, i) => stats.rows.reduce((s, r) => s + r.counts[i], 0));
    const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
    const footer: Record<string, React.ReactNode> = {
      position: "รวมรายเดือนสะสม",
      total: <b>{fmtInt(grandTotal)}</b>,
    };
    monthTotals.forEach((t, i) => (footer[`m${i}`] = fmtInt(t)));
    rows.push(footer);
  }

  return (
    <Slide eyebrow="ผู้ดูแลในระบบ" title="สถิติผู้สมัครแยกตามประเภทและช่วงเดือน">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatTile label="Register" value={fmtInt(stats.registerTotal)} accent={palette.accent} glow="green" />
        <StatTile label="Approve" value={fmtInt(stats.approveTotal)} accent={palette.statusGood} glow="green" />
        <StatTile label="Awaiting approval" value={fmtInt(stats.awaitingTotal)} accent={palette.statusWarning} glow="orange" />
      </div>
      <DataTable columns={columns} rows={rows} highlightLastRow={stats.rows.length > 0} />
    </Slide>
  );
}

function ClosingNotesSlide(notes: ReportNote[], palette: ChartPalette) {
  return (
    <Slide eyebrow="CareWell Report" title="ประเด็นเพิ่มเติม" center={notes.length === 0}>
      {notes.length === 0 ? (
        <p className="text-sm" style={{ color: palette.muted }}>
          ยังไม่มีบันทึกเพิ่มเติม — เพิ่มได้ที่หน้า &quot;นำเข้าข้อมูล&quot;
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note, i) => (
            <div
              key={i}
              className="rounded-2xl border p-6"
              style={{ borderColor: palette.gridline, backgroundColor: palette.surface }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: palette.accent }} />
                <div>
                  <p className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                    {note.topic}
                  </p>
                  {note.detail && (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm" style={{ color: palette.textSecondary }}>
                      {note.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Slide>
  );
}

function subscribeFullscreenChange(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

export function SlideDeck({ data }: { data: SlideDeckData }) {
  const palette = useChartPalette();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreenChange,
    () => !!document.fullscreenElement,
    () => false
  );

  // The presentation always renders in its own fixed dark theme, independent
  // of the rest of the site's light/dark-follows-OS behavior.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "dark");
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      rootRef.current?.requestFullscreen();
    }
  }, []);

  const carewellteam = data.accounts.find((a) => a.key === "carewellteam");
  const carewell = data.accounts.find((a) => a.key === "carewell");

  const slides = useMemo(() => {
    const list: React.ReactNode[] = [
      <Slide key="title" eyebrow="CareWell Report" title="ภาพรวมข้อมูล CareWell" subtitle={data.periodLabel}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="ผู้ดูแลที่ลงทะเบียนทั้งหมด" value={data.totalCaregivers.toLocaleString()} accent={palette.accent} glow="green" />
          <StatTile
            label="ผู้ติดตาม @carewellteam ล่าสุด"
            value={fmtInt(carewellteam?.contacts)}
            delta={fmtDelta(carewellteam?.deltaAbs ?? null)}
            accent={palette.carewellteam}
            glow="blue"
          />
          <StatTile
            label="ผู้ติดตาม @carewell ล่าสุด"
            value={fmtInt(carewell?.contacts)}
            delta={fmtDelta(carewell?.deltaAbs ?? null)}
            accent={palette.carewell}
            glow="orange"
          />
        </div>
      </Slide>,

    ];

    // Chart slides (growth/blocks line charts, status/province/job-type bar
    // charts) are cut for now — the underlying data/aggregation still flows
    // through SlideDeckData so they're a one-line re-add later.

    if (carewellteam) {
      list.push(...AccountOverviewSlides(carewellteam, palette));
      list.push(<div key="position">{PositionMonthSlide(data.positionStats, palette)}</div>);
    }
    if (carewell) list.push(...AccountOverviewSlides(carewell, palette));

    list.push(<div key="notes">{ClosingNotesSlide(data.notes, palette)}</div>);

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, palette]);

  const goTo = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next))),
    [slides.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") goTo(index + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo]);

  // Wheel-to-navigate: a slide with tall content (long tables) still scrolls
  // natively inside itself; only once the wheel gesture hits the top/bottom
  // of that scroll range does it advance to the next/previous slide.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let locked = false;
    let unlockTimer: ReturnType<typeof setTimeout>;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < 4) return;
      const node = el!;
      const atTop = node.scrollTop <= 1;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      const goingDown = e.deltaY > 0;
      const hitBoundary = (goingDown && atBottom) || (!goingDown && atTop);
      if (!hitBoundary) return;

      e.preventDefault();
      if (locked) return;
      locked = true;
      goTo(index + (goingDown ? 1 : -1));
      unlockTimer = setTimeout(() => {
        locked = false;
      }, 650);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(unlockTimer);
    };
  }, [index, goTo]);

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden">
      <AuroraBackground
        className="!absolute inset-0 !h-full !w-full pointer-events-none -z-10"
        starCount={60}
      />

      <Link
        href="/"
        className="fixed top-5 left-6 z-30 flex items-center gap-1.5 text-xs font-medium tracking-wide opacity-70 transition-opacity hover:opacity-100"
        style={{ color: palette.textSecondary }}
      >
        ← CareWell Report
      </Link>

      <div className="fixed top-5 right-6 z-30 flex items-center gap-2">
        <a
          href="/api/export/pptx"
          download
          title="ดาวน์โหลดเป็น .pptx (เปิดใน Google Slides ได้)"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
          style={{ backgroundColor: palette.surface, color: palette.textSecondary, border: `1px solid ${palette.gridline}` }}
        >
          <Download size={13} />
          <span className="hidden sm:inline">Export to Google Slides</span>
        </a>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "ออกจากโหมดเต็มจอ" : "โหมดเต็มจอ"}
          aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "โหมดเต็มจอ"}
          className="flex h-7 w-7 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
          style={{ backgroundColor: palette.surface, color: palette.textSecondary, border: `1px solid ${palette.gridline}` }}
        >
          {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
        </button>
      </div>

      <div ref={scrollRef} key={index} className="h-full overflow-y-auto pr-0 lg:pr-14 animate-[fadeIn_.25s_ease]">
        {slides[index]}
      </div>

      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium lg:hidden"
        style={{ backgroundColor: palette.surface, color: palette.muted, border: `1px solid ${palette.gridline}` }}
      >
        {index + 1} / {slides.length}
      </div>

      <div className="fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="สไลด์ก่อนหน้า"
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm disabled:opacity-20"
          style={{ color: palette.muted }}
        >
          ▲
        </button>

        <div className="flex flex-col items-center gap-2.5 py-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`ไปสไลด์ที่ ${i + 1}`}
              className="rounded-full transition-all"
              style={
                i === index
                  ? { width: 10, height: 10, backgroundColor: palette.accent, boxShadow: `0 0 0 3px ${palette.accent}33` }
                  : {
                      width: 6,
                      height: 6,
                      backgroundColor: "transparent",
                      border: `1.5px solid ${palette.muted}`,
                    }
              }
            />
          ))}
        </div>

        <button
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
          aria-label="สไลด์ถัดไป"
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm disabled:opacity-20"
          style={{ color: palette.muted }}
        >
          ▼
        </button>

        <span className="mt-1 text-[11px] font-medium tabular-nums" style={{ color: palette.muted }}>
          {index + 1}/{slides.length}
        </span>
      </div>
    </div>
  );
}
