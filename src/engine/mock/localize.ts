import type { Locale } from "@/domain";

/** A string written in both supported languages. */
export type L = { en: string; ar: string };

/**
 * Turns every free-text `string` in T into `string | L`, leaving string-literal
 * enums, numbers and booleans untouched. Mock content is written in this shape.
 */
export type Localizable<T> = T extends string
  ? string extends T
    ? T | L
    : T
  : T extends readonly (infer U)[]
    ? Localizable<U>[]
    : T extends object
      ? { [K in keyof T]: Localizable<T[K]> }
      : T;

export const l = (en: string, ar: string): L => ({ en, ar });

function isL(value: unknown): value is L {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length === 2 &&
    typeof (value as Partial<L>).en === "string" &&
    typeof (value as Partial<L>).ar === "string"
  );
}

function resolve(value: unknown, locale: Locale): unknown {
  if (isL(value)) return value[locale];
  if (Array.isArray(value)) return value.map((v) => resolve(v, locale));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, locale)]));
  }
  return value;
}

/** Picks one language out of bilingual mock content. Validate the result with Zod. */
export function localize<T>(value: Localizable<T>, locale: Locale): T {
  return resolve(value, locale) as T;
}
