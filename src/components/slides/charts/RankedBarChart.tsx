"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankedItem } from "@/lib/report";
import { statusColor, useChartPalette } from "@/lib/chart-theme";
import { ChartEmptyState, tooltipStyle } from "./ChartPrimitives";

export function RankedBarChart({
  data,
  colorMode,
}: {
  data: RankedItem[];
  colorMode: "sequential" | "status";
}) {
  const palette = useChartPalette();
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <ChartEmptyState palette={palette} />;
  }

  const seq = palette.sequential;
  const colorFor = (name: string, idx: number) =>
    colorMode === "status"
      ? statusColor(name, palette)
      : seq[Math.min(idx, seq.length - 1)];

  const rowHeight = 34;
  const height = Math.max(160, data.length * rowHeight);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid stroke={palette.gridline} horizontal={false} />
        <XAxis type="number" tick={{ fill: palette.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: palette.textSecondary, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: palette.gridline, opacity: 0.4 }}
          contentStyle={tooltipStyle(palette)}
          formatter={(value) => [Number(value).toLocaleString(), "จำนวน"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, idx) => (
            <Cell key={entry.name} fill={colorFor(entry.name, idx)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
