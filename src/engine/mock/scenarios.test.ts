import { describe, expect, it } from "vitest";
import {
  CompletedSessionSchema,
  DebateTurnSchema,
  LocaleSchema,
  PitchInputSchema,
  QuestionSchema,
  ReportSchema,
  VerdictSchema,
  type PitchInput,
  type Report,
} from "@/domain";
import { localize } from "./localize";
import { MOCK_SCENARIOS, pickScenario } from "./scenarios";

const LOCALES = LocaleSchema.options;
const ARABIC = /[؀-ۿ]/;

/** Proper names that keep their original spelling in every language. */
const UNTRANSLATED_KEYS = new Set(["name", "source"]);

/** Every string value in a nested structure, except proper names. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, v]) =>
      UNTRANSLATED_KEYS.has(key) ? [] : strings(v),
    );
  }
  return [];
}

function moneyCurrencies(report: Report): Set<string> {
  const currencies = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      if (v.unit === "currency" && typeof v.currency === "string") currencies.add(v.currency);
      Object.values(v).forEach(visit);
    }
  };
  visit(report);
  return currencies;
}

it("has the three required scenarios", () => {
  expect(MOCK_SCENARIOS.map((s) => s.id)).toEqual([
    "damascus-healthy-food",
    "mumbai-tutoring",
    "cairo-water-app",
  ]);
});

describe.each(MOCK_SCENARIOS.map((s) => [s.id, s] as const))("scenario %s", (_id, scenario) => {
  describe.each(LOCALES)("in %s", (locale) => {
    const input: PitchInput = {
      ...localize<Omit<PitchInput, "language">>(scenario.input, locale),
      language: locale,
    };
    const transcript = {
      questions: scenario.questions.map((q) => QuestionSchema.parse(localize(q, locale))),
      answers: scenario.questions.map((q) => ({ questionId: String(q.id), text: "answer" })),
      debate: scenario.debate.map((d) => DebateTurnSchema.parse(localize(d, locale))),
      verdicts: scenario.verdicts.map((v) => VerdictSchema.parse(localize(v, locale))),
      report: ReportSchema.parse(localize(scenario.report, locale)),
    };

    it("has a valid sample pitch", () => {
      expect(PitchInputSchema.safeParse(input).error).toBeUndefined();
    });

    it("is a valid completed session", () => {
      const result = CompletedSessionSchema.safeParse({ input, transcript });
      expect(result.error?.issues).toBeUndefined();
    });

    it("is fully written in the right language", () => {
      const text = strings({ ...transcript, input: input.idea });
      const prose = text.filter((s) => s.includes(" "));
      if (locale === "ar") {
        const missing = prose.filter((s) => !ARABIC.test(s));
        expect(missing).toEqual([]);
      } else {
        expect(prose.filter((s) => ARABIC.test(s))).toEqual([]);
      }
    });

    it("uses the pitch's currency for every money figure", () => {
      expect([...moneyCurrencies(transcript.report)]).toEqual([input.budget.currency]);
    });

    it("labels every figure: estimates or sourced facts", () => {
      const figures: { isEstimate: boolean; source?: unknown }[] = [];
      const visit = (value: unknown) => {
        if (Array.isArray(value)) value.forEach(visit);
        else if (typeof value === "object" && value !== null) {
          const v = value as Record<string, unknown>;
          if (typeof v.isEstimate === "boolean") figures.push(v as (typeof figures)[number]);
          Object.values(v).forEach(visit);
        }
      };
      visit(transcript.report);
      expect(figures.length).toBeGreaterThan(20);
      expect(figures.filter((f) => !f.isEstimate && !f.source)).toEqual([]);
    });
  });
});

describe("pickScenario", () => {
  it("prefers a pinned scenario, then the country, then the first one", () => {
    expect(pickScenario(MOCK_SCENARIOS, "cairo-water-app", "IN").id).toBe("cairo-water-app");
    expect(pickScenario(MOCK_SCENARIOS, undefined, "IN").id).toBe("mumbai-tutoring");
    expect(pickScenario(MOCK_SCENARIOS, "unknown", "EG").id).toBe("cairo-water-app");
    expect(pickScenario(MOCK_SCENARIOS, undefined, "FR").id).toBe("damascus-healthy-food");
  });
});
