"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthPoint } from "@/lib/report";
import { useChartPalette } from "@/lib/chart-theme";
import { ChartEmptyState, Legend, tooltipStyle } from "./ChartPrimitives";

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function GrowthLineChart({
  data,
  seriesA,
  seriesB,
  valueLabel,
}: {
  data: GrowthPoint[];
  seriesA: { key: "carewellteam" | "carewellteamBlocks"; label: string };
  seriesB: { key: "carewell" | "carewellBlocks"; label: string };
  valueLabel: string;
}) {
  const palette = useChartPalette();
  const hasData = data.some((d) => d[seriesA.key] !== null || d[seriesB.key] !== null);

  if (!hasData) return <ChartEmptyState palette={palette} />;

  return (
    <div>
      <Legend
        items={[
          { label: seriesA.label, color: palette.carewellteam },
          { label: seriesB.label, color: palette.carewell },
        ]}
        palette={palette}
      />
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={palette.gridline} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: palette.muted, fontSize: 12 }}
            axisLine={{ stroke: palette.baseline }}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: palette.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle(palette)}
            labelFormatter={(v) => formatDate(String(v))}
            formatter={(value, name) => [
              value === null || value === undefined ? "-" : Number(value).toLocaleString(),
              name,
            ]}
          />
          <Line
            type="monotone"
            dataKey={seriesA.key}
            name={seriesA.label}
            stroke={palette.carewellteam}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={seriesB.key}
            name={seriesB.label}
            stroke={palette.carewell}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-right text-[11px]" style={{ color: palette.muted }}>
        หน่วย: {valueLabel}
      </p>
    </div>
  );
}
