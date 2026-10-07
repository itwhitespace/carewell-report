"use client";

import Link from "next/link";
import { Download, Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  CancellationStats,
  ChannelFunnelStat,
  ConversionStat,
  GrowthPoint,
  LineOaRow,
  MonthlyStat,
  PositionMonthStats,
  RankedItem,
  WeeklyConversionStat,
  WeeklyStat,
  WonFinanceStats,
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


export type ReportNote = { topic: string; detail: string | null; status?: string | null };

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
  wonFinance: WonFinanceStats;
  cancellation: CancellationStats;
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
  wide = true,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const palette = useChartPalette();
  return (
    <div
      className={`mx-auto flex h-full w-full flex-col max-w-[1780px] px-4 py-8 sm:px-8 lg:px-12 ${
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
        <p className="mt-1 text-sm sm:text-base" style={{ color: palette.textSecondary }}>
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
    month: shortMonthLabel(f.monthKey),
    friends: `${fmtInt(f.friendCount)} คน`,
    newFriends: `${fmtInt(f.newFriends)} คน`,
    register: (
      <span style={{ color: f.registerCount > 0 ? "#FACC15" : undefined, fontWeight: f.registerCount > 0 ? 600 : 400 }}>
        {f.registerCount} คน
      </span>
    ),
    matching: (
      <span style={{ color: f.matchingCount > 0 ? "#F59E0B" : undefined, fontWeight: f.matchingCount > 0 ? 600 : 400 }}>
        {f.matchingCount > 0 ? `${f.matchingCount} ราย` : "-"}
      </span>
    ),
    won: (
      <span style={{ color: f.wonCount > 0 ? palette.statusGood : undefined, fontWeight: f.wonCount > 0 ? 600 : 400 }}>
        {f.wonCount > 0 ? `${f.wonCount} ราย (Won)` : "0 ราย"}
      </span>
    ),
    cancel: (
      <span style={{ color: f.cancelCount > 0 ? "#F87171" : undefined, fontWeight: f.cancelCount > 0 ? 600 : 400 }}>
        {f.cancelCount > 0 ? String(f.cancelCount) : "-"}
      </span>
    ),
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
            <DataTable columns={funnelColumns} rows={funnelRows} highlightLastRow={funnelRows.length > 0} compact />
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

function WonFinanceSlide(wonFinance: WonFinanceStats, palette: ChartPalette) {
  const columns: Column[] = [
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
      key: "wonCount",
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
      key: "net",
      label: (
        <div>
          ยอดสุทธิทั้งหมด
          <br />
          <span className="text-[10px] font-normal opacity-85">(Total Net)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "fee",
      label: (
        <div>
          ค่าดำเนินการ
          <br />
          <span className="text-[10px] font-normal opacity-85">(Company Fee)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "caregiverNet",
      label: (
        <div>
          ยอดที่ผู้ดูแลได้รับ
          <br />
          <span className="text-[10px] font-normal opacity-85">(Caregiver Net)</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "feePct",
      label: (
        <div>
          สัดส่วนค่าดำเนินการ
          <br />
          <span className="text-[10px] font-normal opacity-85">(Fee %)</span>
        </div>
      ),
      align: "right",
    },
  ];

  const rows: Record<string, React.ReactNode>[] = wonFinance.monthly.map((m) => ({
    month: shortMonthLabel(m.monthKey),
    wonCount: (
      <span style={{ color: palette.statusGood, fontWeight: 600 }}>
        {m.wonCount} ราย
      </span>
    ),
    net: (
      <span className="font-mono font-semibold" style={{ color: palette.textPrimary }}>
        {Math.round(m.totalNet).toLocaleString("th-TH")} ฿
      </span>
    ),
    fee: (
      <span className="font-mono font-semibold text-amber-500">
        {Math.round(m.totalFee).toLocaleString("th-TH")} ฿
      </span>
    ),
    caregiverNet: (
      <span className="font-mono font-semibold text-emerald-400">
        {Math.round(m.totalCaregiverNet).toLocaleString("th-TH")} ฿
      </span>
    ),
    feePct: (
      <span className="font-mono font-medium text-neutral-300">
        {fmtPct(m.effectiveFeePct, 2)}
      </span>
    ),
  }));

  if (wonFinance.monthly.length > 0) {
    rows.push({
      month: <b>ยอดรวมสะสม (Total)</b>,
      wonCount: <b>{wonFinance.grandWonCount} ราย</b>,
      net: <b>{Math.round(wonFinance.grandTotalNet).toLocaleString("th-TH")} ฿</b>,
      fee: <b>{Math.round(wonFinance.grandTotalFee).toLocaleString("th-TH")} ฿</b>,
      caregiverNet: <b>{Math.round(wonFinance.grandTotalCaregiverNet).toLocaleString("th-TH")} ฿</b>,
      feePct: <b>{fmtPct(wonFinance.grandEffectiveFeePct, 2)}</b>,
    });
  }

  return (
    <Slide
      eyebrow="ผู้รับบริการ — รายได้และค่าดำเนินการ"
      title="สรุปผลประกอบการรายเดือน (Won Deals)"
      subtitle="ยอดสุทธิทั้งหมด, ค่าดำเนินการ (Fee) และยอดที่ผู้ดูแลได้รับ แยกตามเดือนที่เริ่มบริการ"
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="ปิดการขายสำเร็จสะสม"
          value={`${wonFinance.grandWonCount} ราย`}
          accent={palette.accent}
          glow="green"
        />
        <StatTile
          label="ยอดสุทธิทั้งหมด (Total Net)"
          value={`${Math.round(wonFinance.grandTotalNet).toLocaleString("th-TH")} ฿`}
          accent={palette.statusGood}
          glow="green"
        />
        <StatTile
          label="ค่าดำเนินการสะสม (Fee)"
          value={`${Math.round(wonFinance.grandTotalFee).toLocaleString("th-TH")} ฿`}
          accent="#F59E0B"
          glow="orange"
        />
        <StatTile
          label="ยอดผู้ดูแลได้รับสะสม"
          value={`${Math.round(wonFinance.grandTotalCaregiverNet).toLocaleString("th-TH")} ฿`}
          accent={palette.carewellteam}
          glow="blue"
        />
      </div>
      <DataTable columns={columns} rows={rows} highlightLastRow={wonFinance.monthly.length > 0} />
    </Slide>
  );
}

type MonthValue = {
  amount: number;
  type: "realized" | "pending" | "none";
};

type ProjectionRow = {
  id?: string;
  jobCode: string;
  jobType: string;
  duration: number;
  netTotal: number;
  feeAmount: number;
  caregiverNet: number;
  monthlyValues: MonthValue[];
  status: "เสร็จสิ้น" | "ดำเนินการอยู่" | "รอดำเนินการ";
};

function buildProjectionRows(wonFinance: WonFinanceStats): ProjectionRow[] {
  if (!wonFinance.items || wonFinance.items.length === 0) {
    return [
      {
        id: "1",
        jobCode: "SR-2605-0044",
        jobType: "ไป-กลับ",
        duration: 1,
        netTotal: 1200,
        feeAmount: 300,
        caregiverNet: 900,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 4 ? { amount: 300, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
      {
        id: "2",
        jobCode: "SR-2607-0049",
        jobType: "รายวัน",
        duration: 1,
        netTotal: 27800,
        feeAmount: 6290,
        caregiverNet: 21510,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 6 ? { amount: 6290, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
      {
        id: "3",
        jobCode: "SR-2608-0057",
        jobType: "รายวัน",
        duration: 1,
        netTotal: 22000,
        feeAmount: 2640,
        caregiverNet: 19360,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 7 ? { amount: 2640, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
      {
        id: "4",
        jobCode: "SR-2608-0061",
        jobType: "รายวัน",
        duration: 1,
        netTotal: 6000,
        feeAmount: 720,
        caregiverNet: 5280,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 8 ? { amount: 720, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
      {
        id: "5",
        jobCode: "SR-2609-0066",
        jobType: "รายเดือน (3 เดือน)",
        duration: 3,
        netTotal: 21900,
        feeAmount: 2628,
        caregiverNet: 19272,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 8
            ? { amount: 2628, type: "realized" }
            : i === 9 || i === 10
            ? { amount: 2628, type: "pending" }
            : { amount: 0, type: "none" }
        ),
        status: "ดำเนินการอยู่",
      },
      {
        id: "6",
        jobCode: "SR-2609-0070",
        jobType: "ไป-กลับ",
        duration: 1,
        netTotal: 1700,
        feeAmount: 300,
        caregiverNet: 1400,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 8 ? { amount: 300, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
      {
        id: "7",
        jobCode: "SR-2609-0067",
        jobType: "ไป-กลับ",
        duration: 1,
        netTotal: 3600,
        feeAmount: 540,
        caregiverNet: 3060,
        monthlyValues: Array.from({ length: 12 }, (_, i) =>
          i === 8 ? { amount: 540, type: "realized" } : { amount: 0, type: "none" }
        ),
        status: "เสร็จสิ้น",
      },
    ];
  }

  return wonFinance.items.map((item) => {
    let startMonth = 8; // fallback September
    if (item.serviceDate) {
      const parts = item.serviceDate.split("-");
      if (parts.length >= 2) {
        startMonth = parseInt(parts[1], 10) - 1;
      }
    }

    const fmt = item.workFormat || "";
    let duration = 1;
    let jobType = "ไป-กลับ";

    if (fmt.includes("รายเดือน")) {
      const match = fmt.match(/(\d+)\s*เดือน/);
      if (match) {
        duration = parseInt(match[1], 10);
        jobType = `รายเดือน (${duration} เดือน)`;
      } else {
        jobType = "รายเดือน";
      }
    } else if (fmt.includes("รายวัน")) {
      jobType = "รายวัน";
    } else if (fmt.includes("ไป-กลับ") || fmt.includes("ไปกลับ")) {
      jobType = "ไป-กลับ";
    } else {
      jobType = fmt || "ไป-กลับ";
    }

    const monthlyValues: MonthValue[] = Array.from({ length: 12 }, (_, m) => {
      if (m === startMonth) {
        return { amount: item.feeAmount, type: "realized" };
      } else if (m > startMonth && m < startMonth + duration && m < 12) {
        return { amount: item.feeAmount, type: "pending" };
      }
      return { amount: 0, type: "none" };
    });

    const status: "เสร็จสิ้น" | "ดำเนินการอยู่" | "รอดำเนินการ" =
      duration > 1 ? "ดำเนินการอยู่" : "เสร็จสิ้น";

    return {
      id: item.id,
      jobCode: item.jobCode,
      jobType,
      duration,
      netTotal: item.netTotal,
      feeAmount: item.feeAmount,
      caregiverNet: item.caregiverNet,
      monthlyValues,
      status,
    };
  });
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

function WonFinanceDetailSlide(wonFinance: WonFinanceStats, palette: ChartPalette) {
  const rows = buildProjectionRows(wonFinance);

  // Grand contract totals (multiplying by contract duration for monthly contracts)
  const totalContractNet = rows.reduce((s, r) => s + r.netTotal * (r.duration || 1), 0);
  const totalContractFee = rows.reduce((s, r) => s + r.feeAmount * (r.duration || 1), 0);
  const totalContractCaregiverNet = rows.reduce((s, r) => s + r.caregiverNet * (r.duration || 1), 0);

  // Contract count by month
  const contractCountByMonth = Array.from({ length: 12 }, (_, m) =>
    rows.filter((r) => r.monthlyValues[m].type !== "none").length
  );

  // Summary 1: Realized Fee by month
  const realizedByMonth = Array.from({ length: 12 }, (_, m) =>
    rows.reduce((sum, r) => sum + (r.monthlyValues[m].type === "realized" ? r.monthlyValues[m].amount : 0), 0)
  );
  const totalRealized = realizedByMonth.reduce((a, b) => a + b, 0);

  // Summary 2: Pending Fee by month
  const pendingByMonth = Array.from({ length: 12 }, (_, m) =>
    rows.reduce((sum, r) => sum + (r.monthlyValues[m].type === "pending" ? r.monthlyValues[m].amount : 0), 0)
  );
  const totalPending = pendingByMonth.reduce((a, b) => a + b, 0);

  // Summary 3: Total expected Fee
  const totalExpected = totalRealized + totalPending;

  return (
    <Slide
      eyebrow="ผู้รับบริการ — การคาดการณ์ค่าดำเนินการ (Fee Projection)"
      title="12-Month Fee Projection Calendar — ติดตามค่าดำเนินการและยอดรอรับ"
      subtitle="แจกแจงค่าดำเนินการ (Fee) ที่รับจริงและประมาณการยอดรอรับตามสัญญาตลอด 12 เดือน (Company Fee Tracking)"
      center={false}
      wide={true}
    >
      {/* Stat Tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="ยอดสุทธิ (Total NET)"
          value={`${Math.round(totalContractNet).toLocaleString("th-TH")} ฿`}
          accent={palette.statusGood}
          glow="green"
        />
        <StatTile
          label="ค่าดำเนินการ (Total Fee)"
          value={`${Math.round(totalContractFee).toLocaleString("th-TH")} ฿`}
          accent="#F59E0B"
          glow="orange"
        />
        <StatTile
          label="ยอดผู้ดูแลรับ (Caregiver Net)"
          value={`${Math.round(totalContractCaregiverNet).toLocaleString("th-TH")} ฿`}
          accent={palette.accent}
          glow="green"
        />
        <StatTile
          label="จำนวนสัญญา (Total Contracts)"
          value={`${rows.length} สัญญา`}
          accent={palette.carewellteam}
          glow="blue"
        />
      </div>

      {/* 12-Month Projection Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-neutral-800/90 bg-[#0b101c]/95 shadow-2xl backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px] border-collapse text-left">
            <thead>
              <tr className="border-b border-emerald-500/30 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white font-bold tracking-wide text-xs sm:text-sm">
                <th className="px-3.5 py-3 whitespace-nowrap text-left">
                  <div>รหัสงาน</div>
                  <div className="text-[10px] font-normal opacity-85">(Job ID)</div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-left">
                  <div>รูปแบบงาน</div>
                  <div className="text-[10px] font-normal opacity-85">(Job Type)</div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  <div>ยอดสุทธิ</div>
                  <div className="text-[10px] font-normal opacity-85">(NET)</div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  <div>ค่าดำเนินการ</div>
                  <div className="text-[10px] font-normal opacity-85">(Fee)</div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  <div>ยอดผู้ดูแลรับ</div>
                  <div className="text-[10px] font-normal opacity-85">(Caregiver Net)</div>
                </th>
                {THAI_MONTHS_SHORT.map((m) => (
                  <th key={m} className="px-1.5 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-bold">
                    {m}
                  </th>
                ))}
                <th className="px-3.5 py-3 whitespace-nowrap text-center">
                  <div>สถานะสัญญา</div>
                  <div className="text-[10px] font-normal opacity-85">(Status)</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200 text-sm">
              {rows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className={`transition-colors hover:bg-neutral-800/50 ${
                    idx % 2 === 0 ? "bg-[#0c121e]/70" : "bg-[#101726]/70"
                  }`}
                >
                  <td className="px-3.5 py-3 font-bold text-white whitespace-nowrap text-sm sm:text-base">
                    {r.jobCode}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-block rounded-lg bg-neutral-800/90 border border-neutral-700 px-2.5 py-1 text-xs sm:text-sm font-semibold text-neutral-200">
                      {r.jobType}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-white text-right whitespace-nowrap text-sm sm:text-base">
                    {r.netTotal.toLocaleString("th-TH")} ฿
                  </td>
                  <td className="px-3 py-3 font-mono text-right whitespace-nowrap">
                    <div className="font-bold text-amber-400 text-sm sm:text-base">
                      {r.feeAmount.toLocaleString("th-TH")} ฿
                    </div>
                    <div className="text-[11px] font-medium text-amber-300/80">
                      ({r.netTotal > 0 ? ((r.feeAmount / r.netTotal) * 100).toFixed(1) : "0"}%)
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-emerald-400 text-right whitespace-nowrap text-sm sm:text-base">
                    {r.caregiverNet.toLocaleString("th-TH")} ฿
                  </td>
                  {r.monthlyValues.map((mv, mIdx) => (
                    <td key={mIdx} className="px-1 py-3 text-center whitespace-nowrap">
                      {mv.type === "realized" ? (
                        <div className="inline-flex min-w-[84px] flex-col items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-500/60 px-2 py-1 shadow-sm transition-transform hover:scale-105">
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-emerald-300">
                            {mv.amount.toLocaleString("th-TH")} ฿
                          </span>
                          <span className="text-[10px] sm:text-xs font-semibold text-emerald-400">
                            (รับแล้ว)
                          </span>
                        </div>
                      ) : mv.type === "pending" ? (
                        <div className="inline-flex min-w-[84px] flex-col items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/60 px-2 py-1 shadow-sm transition-transform hover:scale-105">
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-300">
                            {mv.amount.toLocaleString("th-TH")} ฿
                          </span>
                          <span className="text-[10px] sm:text-xs font-semibold text-amber-400">
                            (รอรับ)
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-neutral-600 text-base font-semibold">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3.5 py-3 text-center whitespace-nowrap">
                    {r.status === "ดำเนินการอยู่" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-emerald-500/70 px-3 py-1 text-xs sm:text-sm font-bold text-emerald-300 shadow-md">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        ดำเนินการอยู่
                      </span>
                    ) : r.status === "เสร็จสิ้น" ? (
                      <span className="inline-flex items-center rounded-full bg-neutral-800/90 border border-neutral-700 px-3.5 py-1 text-xs sm:text-sm font-medium text-neutral-300">
                        เสร็จสิ้น
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-950/90 border border-amber-700 px-3.5 py-1 text-xs sm:text-sm font-medium text-amber-300">
                        รอดำเนินการ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Row 0: จำนวนสัญญาในแต่ละเดือน (Active Contracts) */}
              <tr className="border-t-2 border-cyan-500/40 bg-cyan-950/30 text-cyan-300 text-sm">
                <td colSpan={2} className="px-3.5 py-3 text-left font-bold whitespace-nowrap text-sm sm:text-base">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-xs" />
                    <div>
                      <div>จำนวนสัญญาแต่ละเดือน</div>
                      <div className="text-[10px] font-normal opacity-85">(Active Contracts)</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-center text-neutral-500 whitespace-nowrap text-sm sm:text-base">
                  -
                </td>
                <td className="px-3 py-3 font-mono text-center text-neutral-500 whitespace-nowrap text-sm sm:text-base">
                  -
                </td>
                <td className="px-3 py-3 font-mono text-center text-neutral-500 whitespace-nowrap text-sm sm:text-base">
                  -
                </td>
                {contractCountByMonth.map((cnt, mIdx) => (
                  <td key={mIdx} className="px-1 py-3 font-mono text-center whitespace-nowrap">
                    {cnt > 0 ? (
                      <span className="inline-block rounded-md bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 font-extrabold text-xs sm:text-sm text-cyan-300">
                        {cnt} สัญญา
                      </span>
                    ) : (
                      <span className="text-neutral-600 font-semibold text-base">-</span>
                    )}
                  </td>
                ))}
                <td className="px-3.5 py-3 text-center text-neutral-500 font-medium">-</td>
              </tr>

              {/* Row 1: รวมรายได้คาดการณ์ทั้งหมด (Total Expected) */}
              <tr className="border-t-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-[#0d2e24] to-teal-950 font-black text-white text-base">
                <td colSpan={2} className="px-3.5 py-3.5 text-left whitespace-nowrap">
                  <div className="inline-flex items-center gap-2 text-white tracking-wide text-sm sm:text-base font-black">
                    <span className="text-emerald-400 text-lg">★</span>
                    <div>
                      <div>รวมรายได้คาดการณ์ทั้งหมด</div>
                      <div className="text-[10px] font-normal opacity-85">(Total Expected)</div>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3.5 font-mono text-center text-neutral-500 whitespace-nowrap text-base sm:text-lg">
                  -
                </td>
                <td className="px-3.5 py-3.5 font-mono text-center text-neutral-500 whitespace-nowrap text-base sm:text-lg">
                  -
                </td>
                <td className="px-3.5 py-3.5 font-mono text-center text-neutral-500 whitespace-nowrap text-base sm:text-lg">
                  -
                </td>
                {Array.from({ length: 12 }, (_, mIdx) => {
                  const rVal = realizedByMonth[mIdx];
                  const pVal = pendingByMonth[mIdx];
                  if (rVal > 0 && pVal > 0) {
                    return (
                      <td key={mIdx} className="px-1 py-3 font-mono text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="font-extrabold text-xs sm:text-sm text-emerald-300 font-mono">
                            {rVal.toLocaleString("th-TH")} ฿
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm text-amber-300 font-mono">
                            {pVal.toLocaleString("th-TH")} ฿
                          </span>
                        </div>
                      </td>
                    );
                  }
                  if (rVal > 0) {
                    return (
                      <td key={mIdx} className="px-1 py-3.5 font-mono text-center whitespace-nowrap">
                        <span className="font-black text-xs sm:text-sm text-emerald-300 font-mono">
                          {rVal.toLocaleString("th-TH")} ฿
                        </span>
                      </td>
                    );
                  }
                  if (pVal > 0) {
                    return (
                      <td key={mIdx} className="px-1 py-3.5 font-mono text-center whitespace-nowrap">
                        <span className="font-black text-xs sm:text-sm text-amber-300 font-mono">
                          {pVal.toLocaleString("th-TH")} ฿
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={mIdx} className="px-1 py-3.5 font-mono text-center whitespace-nowrap">
                      <span className="text-neutral-600 font-semibold text-base">-</span>
                    </td>
                  );
                })}
                <td className="px-3.5 py-3.5 text-center font-mono text-emerald-300 font-black whitespace-nowrap text-sm sm:text-base">
                  {Math.round(totalExpected).toLocaleString("th-TH")} ฿
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* หมายเหตุการคำนวณ */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-[#0c121e]/80 px-4 py-2.5 text-xs text-neutral-400">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-bold text-neutral-200">📌 หมายเหตุ:</span>
          <span>
            <b>ยอดในการ์ดด้านบน (Total NET, Total Fee, Caregiver Net)</b>: คำนวณจากยอดรวมตามสัญญาตลอดอายุสัญญา (กรณีสัญญาจ้างรายเดือน คำนวณคูณตามจำนวนเดือนในสัญญา)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            สีเขียว = รับชำระแล้ว (Realized)
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            สีส้ม = รอรับตามงวดสัญญา (Pending)
          </span>
        </div>
      </div>
    </Slide>
  );
}

function CancellationAnalysisSlide(cancellation: CancellationStats, palette: ChartPalette) {
  const cancelColumns: Column[] = [
    { key: "rank", label: "อันดับ", align: "center" },
    { key: "reason", label: "สาเหตุการยกเลิกงาน (Cancellation Reason)" },
    { key: "count", label: "จำนวนงานที่ยกเลิก", align: "right" },
    { key: "pct", label: "สัดส่วน (%)", align: "right" },
    { key: "bar", label: "แผนภูมิสัดส่วนเปรียบเทียบ" },
  ];

  const cancelRows: Record<string, React.ReactNode>[] = cancellation.reasons.map((r, i) => ({
    rank: (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
        style={{
          backgroundColor: i === 0 ? "rgba(239, 68, 68, 0.2)" : i === 1 ? "rgba(245, 158, 11, 0.2)" : `${palette.accent}22`,
          color: i === 0 ? palette.statusCritical : i === 1 ? "#F59E0B" : palette.accent,
        }}
      >
        {i + 1}
      </span>
    ),
    reason: (
      <span className="font-medium" style={{ color: palette.textPrimary }}>
        {r.reason}
      </span>
    ),
    count: (
      <span className="font-mono font-bold" style={{ color: palette.statusCritical }}>
        {r.count} ราย
      </span>
    ),
    pct: (
      <span className="font-mono font-semibold" style={{ color: palette.textPrimary }}>
        {fmtPct(r.pct, 1)}
      </span>
    ),
    bar: (
      <div className="flex items-center gap-2 min-w-[120px] max-w-[240px]">
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: palette.gridline }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(4, r.pct)}%`,
              backgroundColor: i === 0 ? palette.statusCritical : i === 1 ? "#F59E0B" : palette.accent,
            }}
          />
        </div>
      </div>
    ),
  }));

  if (cancellation.reasons.length > 0) {
    cancelRows.push({
      rank: "-",
      reason: <span className="font-bold text-white">รวมงานที่ยกเลิกทั้งหมด (Total)</span>,
      count: <span className="font-mono font-bold text-red-400">{cancellation.totalCancelled} ราย</span>,
      pct: <span className="font-mono font-bold text-white">100.0%</span>,
      bar: "-",
    });
  }

  return (
    <Slide
      eyebrow="ผู้รับบริการ — สถิติการยกเลิกงาน"
      title="สรุปสถิติสาเหตุการยกเลิกงานทั้งหมด"
      subtitle="วิเคราะห์สัดส่วนสาเหตุการยกเลิกงานทั้งหมดที่บันทึก เพื่อดูสถิติและสัดส่วนของปัญหาที่พบบ่อย"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="จำนวนงานที่ยกเลิกทั้งหมด"
          value={`${cancellation.totalCancelled} ราย`}
          accent={palette.statusCritical}
          glow="red"
        />
        <StatTile
          label="อัตราการยกเลิกงาน (Cancel Rate)"
          value={fmtPct(cancellation.cancellationRatePct, 1)}
          delta={cancellation.totalRecipients > 0 ? `จากเคสผู้รับบริการทั้งหมด ${cancellation.totalRecipients} ราย` : null}
          accent={palette.statusCritical}
          glow="red"
        />
        <StatTile
          label="สาเหตุหลักที่พบบ่อยอันดับ 1"
          value={cancellation.topReason ?? "ไม่มีข้อมูล"}
          accent="#F59E0B"
          glow="orange"
        />
      </div>

      {cancellation.reasons.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center text-sm"
          style={{ borderColor: palette.gridline, backgroundColor: palette.surface, color: palette.muted }}
        >
          ยังไม่มีการบันทึกสาเหตุการยกเลิกงานในระบบ
        </div>
      ) : (
        <DataTable columns={cancelColumns} rows={cancelRows} highlightLastRow={cancelRows.length > 0} compact />
      )}
    </Slide>
  );
}

function ClosingNotesSlide(notes: ReportNote[], palette: ChartPalette) {
  const sortedNotes = [...notes].sort((a, b) => {
    const aIsNew = a.status === "ประเด็นใหม่" || a.status !== "ดำเนินการแล้ว";
    const bIsNew = b.status === "ประเด็นใหม่" || b.status !== "ดำเนินการแล้ว";
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return 0;
  });

  return (
    <Slide eyebrow="CareWell Report" title="ประเด็นเพิ่มเติม" center={sortedNotes.length === 0}>
      {sortedNotes.length === 0 ? (
        <p className="text-base" style={{ color: palette.muted }}>
          ยังไม่มีบันทึกเพิ่มเติม — เพิ่มได้ที่หน้า &quot;นำเข้าข้อมูล&quot;
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {sortedNotes.map((note, i) => {
            const isDone = note.status === "ดำเนินการแล้ว";
            const statusColor = isDone ? palette.statusGood : "#f97316";
            const topicColor = isDone ? palette.textPrimary : "#f97316";
            const badgeBg = isDone ? "#10B9811F" : "#F973161F";
            const badgeBorder = isDone ? "#10B98144" : "#F9731644";

            return (
              <div
                key={i}
                className="rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5 shadow-md transition-all hover:border-orange-500/30"
                style={{ borderColor: palette.gridline, backgroundColor: palette.surface }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <div>
                      <p className="text-sm sm:text-base font-bold" style={{ color: topicColor }}>
                        {note.topic}
                      </p>
                      {note.detail && (
                        <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
                          {note.detail}
                        </p>
                      )}
                    </div>
                  </div>
                  {note.status && (
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: badgeBg,
                        color: statusColor,
                        border: `1px solid ${badgeBorder}`,
                      }}
                    >
                      {note.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
    if (carewell) {
      list.push(...AccountOverviewSlides(carewell, palette));
      list.push(<div key="won-finance">{WonFinanceSlide(data.wonFinance, palette)}</div>);
      list.push(<div key="won-finance-detail">{WonFinanceDetailSlide(data.wonFinance, palette)}</div>);
      list.push(<div key="cancellation-analysis">{CancellationAnalysisSlide(data.cancellation, palette)}</div>);
    }

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
