// Shared helpers for turning messy exported-CSV strings into clean DB values.

/** Case/whitespace-insensitive lookup of a value from a parsed CSV row. */
export function getField(
  row: Record<string, unknown>,
  ...names: string[]
): string {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find(
      (k) => k.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (key !== undefined) {
      const value = row[key];
      if (value !== null && value !== undefined) {
        return String(value).trim();
      }
    }
  }
  return "";
}

/** Parses "1,234" / "1234" / "" into a number or null. */
export function parseNumberOrNull(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parses common exported date formats (YYYY/MM/DD, YYYY-MM-DD, DD/MM/YYYY)
 * into a "YYYY-MM-DD" string for Postgres `date` columns. Returns null if
 * the value can't be confidently parsed.
 */
export function parseDateOrNull(raw: string): string | null {
  const cleaned = raw.trim();
  if (cleaned === "") return null;

  // Thai systems commonly export Buddhist Era years (e.g. 2568 instead of 2025).
  const toGregorianYear = (y: string) => {
    const n = Number(y);
    return n > 2400 ? n - 543 : n;
  };

  const isoMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${toGregorianYear(y)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${toGregorianYear(y)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // LINE OA Manager exports dates as a bare "YYYYMMDD" string (e.g. 20260401).
  const compactMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, y, m, d] = compactMatch;
    return `${toGregorianYear(y)}-${m}-${d}`;
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}
