import type { Figure, SalesScenario } from "@/domain";
import type { L, Localizable } from "./localize";

type FigureOptions = { note?: L; low?: number; high?: number };

/** All mock numbers are estimates unless built with `fact`. */
export function money(
  value: number,
  currency: string,
  opts: FigureOptions = {},
): Localizable<Figure> {
  return { value, unit: "currency", currency, isEstimate: true, ...opts };
}

export function score(value: number): Localizable<Figure> {
  return { value, unit: "score", isEstimate: true };
}

export function count(value: number, opts: FigureOptions = {}): Localizable<Figure> {
  return { value, unit: "count", isEstimate: true, ...opts };
}

export function percent(value: number, opts: FigureOptions = {}): Localizable<Figure> {
  return { value, unit: "percent", isEstimate: true, ...opts };
}

/** A sourced fact. Only use with a real, checkable source. */
export function fact(
  figure: Localizable<Figure>,
  source: { title: string; publisher: string; url?: string; year?: number },
): Localizable<Figure> {
  return { ...figure, isEstimate: false, source };
}

/** Monthly revenue estimates growing (or shrinking) at a steady rate, rounded to tens. */
export function monthlyRevenue(
  start: number,
  monthlyGrowth: number,
  currency: string,
  months = 12,
): Localizable<SalesScenario["monthly"]> {
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    revenue: money(Math.round((start * (1 + monthlyGrowth) ** i) / 10) * 10, currency),
  }));
}
