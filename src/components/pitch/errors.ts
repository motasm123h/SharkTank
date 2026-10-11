import type { FieldError } from "react-hook-form";
import { IDEA_MAX_LENGTH, IDEA_MIN_LENGTH } from "@/domain";

type ErrorKey =
  | "ideaTooShort"
  | "ideaTooLong"
  | "country"
  | "city"
  | "number"
  | "budgetOrder"
  | "required"
  | "invalid";

export type FormField =
  | "idea"
  | "country"
  | "city"
  | "budget.min"
  | "budget.max"
  | "budget.currency"
  | "mode"
  | "stage"
  | "language";

/**
 * Maps a Zod issue (surfaced by react-hook-form as `error.type`) to a translated
 * message key, so schema messages (written for developers) never reach users.
 */
export function errorKeyFor(
  field: FormField,
  error: FieldError,
): { key: ErrorKey; values?: Record<string, number> } {
  switch (field) {
    case "idea":
      if (error.type === "too_big") return { key: "ideaTooLong", values: { max: IDEA_MAX_LENGTH } };
      return { key: "ideaTooShort", values: { min: IDEA_MIN_LENGTH } };
    case "country":
      return { key: "country" };
    case "city":
      return { key: "city" };
    case "budget.min":
    case "budget.max":
      return error.type === "custom" ? { key: "budgetOrder" } : { key: "number" };
    case "mode":
    case "stage":
    case "language":
      return { key: "required" };
    default:
      return { key: "invalid" };
  }
}
