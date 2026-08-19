"use client";

import { useSyncExternalStore } from "react";
import { classifyCaregiverStatus, type ConversionTier, type GrowthTier } from "./report";

// Reference palette (see dataviz skill / references/palette.md).
// Series identity is fixed per account so the same account always gets the
// same color across every chart, never reassigned by rank or filter state.
export const palette = {
  light: {
    mode: "light" as const,
    pagePlane: "#f9f9f7",
    surface: "#fcfcfb",
    textPrimary: "#0b0b0b",
    textSecondary: "#52514e",
    muted: "#898781",
    gridline: "#e1e0d9",
    baseline: "#c3c2b7",
    carewellteam: "#2a78d6", // categorical slot 1 (blue)
    carewell: "#eb6834", // categorical slot 2 (orange)
    accent: "#1baf7a", // categorical slot 3 (aqua) — used for summary/report chrome
    sequential: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"],
    statusGood: "#0ca30c",
    statusWarning: "#fab219",
    statusCritical: "#d03b3b",
    statusNeutral: "#898781",
  },
  dark: {
    mode: "dark" as const,
    pagePlane: "#0d0d0d",
    surface: "#1a1a19",
    textPrimary: "#ffffff",
    textSecondary: "#c3c2b7",
    muted: "#898781",
    gridline: "#2c2c2a",
    baseline: "#383835",
    carewellteam: "#3987e5",
    carewell: "#d95926",
    accent: "#199e70",
    sequential: ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"],
    statusGood: "#0ca30c",
    statusWarning: "#fab219",
    statusCritical: "#d03b3b",
    statusNeutral: "#898781",
  },
} as const;

export type ChartPalette = {
  mode: "light" | "dark";
  pagePlane: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  gridline: string;
  baseline: string;
  carewellteam: string;
  carewell: string;
  accent: string;
  sequential: readonly string[];
  statusGood: string;
  statusWarning: string;
  statusCritical: string;
  statusNeutral: string;
};

function resolveMode(): "light" | "dark" {
  const forced = document.documentElement.getAttribute("data-theme");
  if (forced === "dark") return "dark";
  if (forced === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToModeChanges(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;

  media.addEventListener("change", callback);
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  return () => {
    media.removeEventListener("change", callback);
    observer.disconnect();
  };
}

const getServerMode = () => "light" as const;

export function useChartPalette(): ChartPalette {
  const mode = useSyncExternalStore(subscribeToModeChanges, resolveMode, getServerMode);
  return palette[mode];
}

/** Deterministic status -> semantic color, so the same label always maps the same way. */
export function statusColor(status: string, p: ChartPalette): string {
  switch (classifyCaregiverStatus(status)) {
    case "critical":
      return p.statusCritical;
    case "pending":
      return p.statusWarning;
    case "good":
      return p.statusGood;
    default:
      return p.statusNeutral;
  }
}

function relativeLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Black or white, whichever reads better on top of `bg`. */
export function contrastText(bg: string): string {
  return relativeLuminance(bg) > 0.4 ? "#0b0b0b" : "#ffffff";
}

const GROWTH_TIER_ORDER: GrowthTier[] = ["stable", "moderate", "fast", "explosive"];
const GROWTH_TIER_STEPS: Record<"light" | "dark", string[]> = {
  light: ["#cde2fb", "#6da7ec", "#3987e5", "#184f95"],
  dark: ["#184f95", "#256abf", "#3987e5", "#9ec5f4"],
};

/** Ordinal ramp (single hue, light -> dark) for the 4 weekly growth tiers —
 * an ordered magnitude, not a set of independent states, so it borrows the
 * sequential hue rather than the reserved status palette. */
export function growthTierStyle(tier: GrowthTier, p: ChartPalette) {
  const bg = GROWTH_TIER_STEPS[p.mode][GROWTH_TIER_ORDER.indexOf(tier)];
  return { bg, fg: contrastText(bg) };
}

const CONVERSION_TIER_ORDER: ConversionTier[] = ["low", "high", "exceptional"];
const CONVERSION_TIER_STEPS: Record<"light" | "dark", string[]> = {
  light: ["#cde2fb", "#6da7ec", "#184f95"],
  dark: ["#184f95", "#3987e5", "#9ec5f4"],
};

export function conversionTierStyle(tier: ConversionTier, p: ChartPalette) {
  const bg = CONVERSION_TIER_STEPS[p.mode][CONVERSION_TIER_ORDER.indexOf(tier)];
  return { bg, fg: contrastText(bg) };
}
