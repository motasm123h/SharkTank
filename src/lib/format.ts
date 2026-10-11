import type { Figure, Locale } from "@/domain";

/**
 * Locale tag for numbers. Arabic pages use Western digits (as most Arabic
 * websites do) and the same tag on server and client, so hydration matches.
 */
export function numberLocale(locale: Locale): string {
  return locale === "ar" ? "ar-u-nu-latn" : "en";
}

export function formatMoney(
  value: number,
  currency: string,
  locale: Locale,
  opts: { compact?: boolean } = {},
): string {
  const compact = opts.compact && Math.abs(value) >= 10_000;
  // Whole amounts stay whole ($18, not $18.00); cents only when they exist ($2.50).
  const cents = !compact && !Number.isInteger(value) && Math.abs(value) < 100;
  return new Intl.NumberFormat(numberLocale(locale), {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : compact ? 1 : 0,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale, opts: { compact?: boolean } = {}) {
  const compact = opts.compact ?? Math.abs(value) >= 100_000;
  return new Intl.NumberFormat(numberLocale(locale), {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 1,
  }).format(value);
}

/** Formats a figure's value (not its range) according to its unit. */
export function formatFigureValue(figure: Figure, locale: Locale, value = figure.value): string {
  switch (figure.unit) {
    case "currency":
      return formatMoney(value, figure.currency ?? "USD", locale, { compact: true });
    case "percent":
      return new Intl.NumberFormat(numberLocale(locale), {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value / 100);
    case "score":
    case "months":
    case "count":
      return formatNumber(value, locale);
  }
}

/** "15–22" style range, or null when the figure has no range. */
export function formatFigureRange(figure: Figure, locale: Locale): string | null {
  if (figure.low === undefined || figure.high === undefined) return null;
  return `${formatFigureValue(figure, locale, figure.low)} – ${formatFigureValue(figure, locale, figure.high)}`;
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(numberLocale(locale), { dateStyle: "long" }).format(date);
}
