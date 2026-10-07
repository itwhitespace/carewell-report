"use client";

import type { ReactNode } from "react";
import { contrastText, useChartPalette } from "@/lib/chart-theme";

export type Column = {
  key: string;
  label: ReactNode;
  align?: "left" | "right" | "center";
};

export function DataTable({
  columns,
  rows,
  highlightLastRow,
  compact,
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  highlightLastRow?: boolean;
  compact?: boolean;
}) {
  const palette = useChartPalette();

  if (rows.length === 0) {
    return (
      <div
        className="flex min-h-[140px] items-center justify-center rounded-xl text-sm sm:text-base"
        style={{ color: palette.muted, backgroundColor: palette.surface }}
      >
        ยังไม่มีข้อมูล — นำเข้า CSV ได้ที่หน้า &quot;นำเข้าข้อมูล&quot;
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl border shadow-xl backdrop-blur-sm"
      style={{ borderColor: palette.gridline }}
    >
      <table className="w-full border-collapse text-sm sm:text-base">
        <thead>
          <tr style={{ backgroundColor: palette.accent }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${compact ? "px-3.5 py-3 text-xs sm:text-sm" : "px-4 py-3.5 text-xs sm:text-sm"} font-bold tracking-wide leading-tight`}
                style={{
                  color: contrastText(palette.accent),
                  textAlign: col.align ?? "left",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isLast = highlightLastRow && i === rows.length - 1;
            return (
              <tr
                key={i}
                className="transition-colors hover:bg-neutral-800/40"
                style={{
                  backgroundColor: isLast
                    ? "rgba(16, 185, 129, 0.22)"
                    : i % 2 === 1
                      ? palette.gridline + "44"
                      : "transparent",
                  borderTop: isLast ? `2px solid ${palette.accent}` : undefined,
                  borderBottom: isLast ? `2px solid ${palette.accent}` : undefined,
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap ${compact ? "px-3.5 py-3" : "px-4 py-3.5"} text-sm sm:text-base`}
                    style={{
                      textAlign: col.align ?? "left",
                      color: isLast ? "#FFFFFF" : palette.textPrimary,
                      fontWeight: isLast ? 700 : 400,
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
