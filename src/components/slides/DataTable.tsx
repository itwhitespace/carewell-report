"use client";

import type { ReactNode } from "react";
import { contrastText, useChartPalette } from "@/lib/chart-theme";

export type Column = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export function DataTable({
  columns,
  rows,
  highlightLastRow,
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  highlightLastRow?: boolean;
}) {
  const palette = useChartPalette();

  if (rows.length === 0) {
    return (
      <div
        className="flex min-h-[140px] items-center justify-center rounded-lg text-sm"
        style={{ color: palette.muted, backgroundColor: palette.surface }}
      >
        ยังไม่มีข้อมูล — นำเข้า CSV ได้ที่หน้า &quot;นำเข้าข้อมูล&quot;
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={{ borderColor: palette.gridline }}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: palette.accent }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
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
                style={{
                  backgroundColor: isLast
                    ? palette.accent
                    : i % 2 === 1
                      ? palette.gridline + "55"
                      : "transparent",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-2.5"
                    style={{
                      textAlign: col.align ?? "left",
                      color: isLast ? contrastText(palette.accent) : palette.textPrimary,
                      fontWeight: isLast ? 600 : 400,
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
