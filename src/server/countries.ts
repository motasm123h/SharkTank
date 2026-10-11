import "server-only";
import countries from "i18n-iso-countries";
import type { Locale } from "@/domain";
import type { ReportRecord } from "./sessions";

/** Every country code a report mentions (home, global fit, competitors). */
function codesIn({ input, report }: ReportRecord): string[] {
  const codes = new Set<string>([input.country]);
  for (const g of report.globalFit) codes.add(g.country);
  for (const s of report.similarIdeas) if (s.country) codes.add(s.country);
  return [...codes];
}

/** alpha-2 → numeric ISO id (as used by the world-atlas map shapes, e.g. "760"). */
export function numericIdsFor(record: ReportRecord): Record<string, string> {
  return Object.fromEntries(
    codesIn(record).flatMap((code) => {
      const numeric = countries.alpha2ToNumeric(code);
      return numeric ? [[code, numeric.padStart(3, "0")]] : [];
    }),
  );
}

/** alpha-2 → country name in the page language, computed once on the server. */
export function countryNamesFor(record: ReportRecord, locale: Locale): Record<string, string> {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return Object.fromEntries(codesIn(record).map((code) => [code, names.of(code) ?? code]));
}
