"use client";

import { useChartPalette } from "@/lib/chart-theme";
import { GlowCard } from "@/components/ui/spotlight-card";

type GlowColor = "blue" | "purple" | "green" | "red" | "orange";

export function StatTile({
  label,
  value,
  delta,
  accent,
  glow = "blue",
}: {
  label: string;
  value: string;
  delta?: string | null;
  accent?: string;
  glow?: GlowColor;
}) {
  const palette = useChartPalette();
  const isUp = !!delta && delta.trim().startsWith("+");
  const isDown = !!delta && delta.trim().startsWith("-");

  return (
    <GlowCard customSize glowColor={glow} className="h-full w-full !grid-rows-none justify-start">
      <div>
        <p className="text-sm font-medium" style={{ color: palette.textSecondary }}>
          {label}
        </p>
        <p
          className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tabular-nums"
          style={{ color: accent ?? palette.textPrimary }}
        >
          {value}
        </p>
        {delta && (
          <p
            className="mt-1 text-sm font-medium"
            style={{
              color: isUp ? palette.statusGood : isDown ? palette.statusCritical : palette.muted,
            }}
          >
            {delta}
          </p>
        )}
      </div>
    </GlowCard>
  );
}
