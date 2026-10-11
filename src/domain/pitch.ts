import { z } from "zod";
import { CountryCodeSchema, CurrencyCodeSchema, LocaleSchema } from "./common";

export const BusinessModeSchema = z.enum(["online", "physical", "hybrid"]);
export type BusinessMode = z.infer<typeof BusinessModeSchema>;

export const StageSchema = z.enum(["idea", "prototype", "selling"]);
export type Stage = z.infer<typeof StageSchema>;

export const BudgetRangeSchema = z
  .object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
    currency: CurrencyCodeSchema,
  })
  .refine((b) => b.min <= b.max, { path: ["max"], message: "max must not be below min" });
export type BudgetRange = z.infer<typeof BudgetRangeSchema>;

export const IDEA_MIN_LENGTH = 20;
export const IDEA_MAX_LENGTH = 2000;

export const PitchInputSchema = z.object({
  idea: z.string().trim().min(IDEA_MIN_LENGTH).max(IDEA_MAX_LENGTH),
  country: CountryCodeSchema,
  city: z.string().trim().min(1).max(100),
  budget: BudgetRangeSchema,
  mode: BusinessModeSchema,
  stage: StageSchema,
  language: LocaleSchema,
});
export type PitchInput = z.infer<typeof PitchInputSchema>;
