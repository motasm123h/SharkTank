import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PitchInput, Report } from "@/domain";
import { localize } from "@/engine/mock/localize";
import { localizeReport } from "@/engine/mock/MockEngine";
import { MOCK_SCENARIOS } from "@/engine/mock/scenarios";
import { formatFigureRange, formatFigureValue, formatMoney } from "@/lib/format";
import { countryNamesFor, numericIdsFor } from "./countries";
import type { ReportRecord } from "./sessions";
import { signPrintToken, verifyPrintToken } from "./signing";

function record(scenarioIndex: number): ReportRecord {
  const scenario = MOCK_SCENARIOS[scenarioIndex]!;
  const input: PitchInput = {
    ...localize<Omit<PitchInput, "language">>(scenario.input, "en"),
    language: "en",
  };
  const report: Report = localizeReport(scenario, "en");
  return {
    id: "00000000-0000-4000-8000-000000000000",
    input,
    report,
    createdAt: new Date(0),
    shareToken: null,
  };
}

describe("number formatting", () => {
  it("formats money with Western digits in Arabic too", () => {
    expect(formatMoney(18, "USD", "en")).toBe("$18");
    expect(formatMoney(2.5, "USD", "en")).toBe("$2.50");
    expect(formatMoney(150000, "INR", "en", { compact: true })).toBe("₹150K");
    expect(formatMoney(8000, "EGP", "ar")).toMatch(/8,000/);
  });

  it("formats each figure unit and its range", () => {
    expect(formatFigureValue({ value: 1.5, unit: "percent", isEstimate: true }, "en")).toBe("1.5%");
    expect(formatFigureValue({ value: 1_450_000_000, unit: "count", isEstimate: true }, "en")).toBe(
      "1.45B",
    );
    expect(
      formatFigureRange(
        { value: 18, low: 15, high: 22, unit: "currency", currency: "USD", isEstimate: true },
        "en",
      ),
    ).toBe("$15 – $22");
    expect(formatFigureRange({ value: 3, unit: "count", isEstimate: true }, "en")).toBeNull();
  });
});

describe("print tokens", () => {
  const id = "11111111-1111-4111-8111-111111111111";

  it("accept a fresh token for the same report only", () => {
    const token = signPrintToken(id);
    expect(verifyPrintToken(id, token)).toBe(true);
    expect(verifyPrintToken("22222222-2222-4222-8222-222222222222", token)).toBe(false);
  });

  it("reject expired, tampered or missing tokens", () => {
    expect(verifyPrintToken(id, signPrintToken(id, -1000))).toBe(false);
    const [expires, sig] = signPrintToken(id).split(".");
    expect(verifyPrintToken(id, `${Number(expires) + 60_000}.${sig}`)).toBe(false);
    expect(verifyPrintToken(id, undefined)).toBe(false);
    expect(verifyPrintToken(id, "garbage")).toBe(false);
  });
});

describe("report countries", () => {
  const atlas = JSON.parse(
    readFileSync(
      new URL("../../node_modules/world-atlas/countries-110m.json", import.meta.url),
      "utf8",
    ),
  ) as { objects: { countries: { geometries: { id?: string; properties: { name: string } }[] } } };
  const mapIds = new Set(atlas.objects.countries.geometries.map((g) => g.id));

  it.each([0, 1, 2])("maps every country in mock report %i to a map shape", (i) => {
    const ids = numericIdsFor(record(i));
    for (const [code, numeric] of Object.entries(ids)) {
      expect(mapIds.has(numeric), `${code} → ${numeric}`).toBe(true);
    }
    expect(ids.SY ?? ids.IN ?? ids.EG).toBeDefined();
  });

  it("names countries in the page language", () => {
    expect(countryNamesFor(record(0), "ar").SY).toBe("سوريا");
    expect(countryNamesFor(record(1), "en").IN).toBe("India");
  });
});
