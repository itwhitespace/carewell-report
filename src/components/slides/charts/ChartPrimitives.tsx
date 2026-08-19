"use client";

import type { ChartPalette } from "@/lib/chart-theme";

export function Legend({
  items,
  palette,
}: {
  items: { label: string; color: string }[];
  palette: ChartPalette;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: palette.textSecondary }}>
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ChartEmptyState({ palette }: { palette: ChartPalette }) {
  return (
    <div
      className="flex h-full min-h-[220px] items-center justify-center rounded-lg text-sm"
      style={{ color: palette.muted, backgroundColor: palette.surface }}
    >
      ยังไม่มีข้อมูล — นำเข้า CSV ได้ที่หน้า &quot;นำเข้าข้อมูล&quot;
    </div>
  );
}

export function tooltipStyle(palette: ChartPalette) {
  return {
    backgroundColor: palette.surface,
    border: `1px solid ${palette.gridline}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    color: palette.textPrimary,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  };
}
