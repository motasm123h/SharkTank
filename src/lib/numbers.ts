const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Parses a number typed by a user in any of our locales: accepts Arabic-Indic
 * digits (٣٠٠٠), thousands separators (3,000 / 3٬000 / 3 000) and the Arabic
 * decimal separator (٫). Returns NaN for anything else, including empty input.
 */
export function parseLocalizedNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return Number.NaN;

  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EASTERN_ARABIC_INDIC.indexOf(d)))
    .replace(/[,٬\s  ]/g, "")
    .replace(/٫/g, ".");

  if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}
