import { z } from "zod";

export const LocaleSchema = z.enum(["en", "ar"]);
export type Locale = z.infer<typeof LocaleSchema>;

/** ISO 3166-1 alpha-2, e.g. "SY", "IN". */
export const CountryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, "Expected an ISO 3166-1 alpha-2 code");
export type CountryCode = z.infer<typeof CountryCodeSchema>;

/** ISO 4217, e.g. "USD", "INR". */
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/, "Expected an ISO 4217 code");
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const SourceSchema = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  publisher: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const FigureUnitSchema = z.enum(["currency", "percent", "count", "months", "score"]);
export type FigureUnit = z.infer<typeof FigureUnitSchema>;

/**
 * Every number shown to the user. Honesty rule: a figure is either an estimate
 * (`isEstimate: true`) or a fact, and a fact must carry a source.
 */
export const FigureSchema = z
  .object({
    value: z.number().finite(),
    unit: FigureUnitSchema,
    currency: CurrencyCodeSchema.optional(),
    /** Optional range around `value` for estimates. */
    low: z.number().finite().optional(),
    high: z.number().finite().optional(),
    isEstimate: z.boolean(),
    source: SourceSchema.optional(),
    note: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    if (!f.isEstimate && !f.source) {
      ctx.addIssue({
        code: "custom",
        path: ["source"],
        message: "A figure presented as a fact needs a source",
      });
    }
    if ((f.unit === "currency") !== (f.currency !== undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["currency"],
        message: "currency is required exactly when unit is 'currency'",
      });
    }
    if (f.low !== undefined && f.value < f.low) {
      ctx.addIssue({ code: "custom", path: ["low"], message: "value is below low" });
    }
    if (f.high !== undefined && f.value > f.high) {
      ctx.addIssue({ code: "custom", path: ["high"], message: "value is above high" });
    }
  });
export type Figure = z.infer<typeof FigureSchema>;

export const MoneySchema = FigureSchema.refine((f) => f.unit === "currency", {
  message: "Expected a currency figure",
});

/** A score figure on a 0..max scale (e.g. 0–10 for dimensions, 0–100 overall). */
export function scoreSchema(max: number) {
  return FigureSchema.refine((f) => f.unit === "score" && f.value >= 0 && f.value <= max, {
    message: `Expected a score between 0 and ${max}`,
  });
}

export const TextSchema = z.string().trim().min(1);
