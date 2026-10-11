import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CountryCodeSchema, CurrencyCodeSchema, JUDGES } from "@/domain";
import { COUNTRY_CODES, countryOptions, currencyOptions, defaultCurrencyFor } from "./countries";
import { parseLocalizedNumber } from "./numbers";

describe("parseLocalizedNumber", () => {
  it.each([
    ["3000", 3000],
    ["3,000", 3000],
    ["٣٠٠٠", 3000],
    ["٣٬٠٠٠", 3000],
    ["۵۰۰", 500],
    [" 1 500 ", 1500],
    ["12.5", 12.5],
    ["١٢٫٥", 12.5],
  ])("parses %s", (raw, expected) => {
    expect(parseLocalizedNumber(raw)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.2.3", "5$"])("rejects %j", (raw) => {
    expect(parseLocalizedNumber(raw)).toBeNaN();
  });
});

describe("countries", () => {
  it("are valid, unique ISO codes", () => {
    expect(COUNTRY_CODES.every((c) => CountryCodeSchema.safeParse(c).success)).toBe(true);
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
  });

  it("have names in both languages", () => {
    const en = countryOptions("en");
    const ar = countryOptions("ar");
    expect(en.find((o) => o.value === "SY")?.label).toBe("Syria");
    expect(ar.find((o) => o.value === "SY")?.label).toBe("سوريا");
    expect(en.length).toBeGreaterThan(240);
  });

  it("default to the local currency, else USD", () => {
    expect(defaultCurrencyFor("IN")).toBe("INR");
    expect(defaultCurrencyFor("DE")).toBe("EUR");
    expect(defaultCurrencyFor("AQ")).toBe("USD");
    expect(defaultCurrencyFor(undefined)).toBe("USD");
  });

  it("offer valid currencies, common ones first", () => {
    const options = currencyOptions("ar");
    expect(options[0]?.value).toBe("USD");
    expect(options.every((o) => CurrencyCodeSchema.safeParse(o.value).success)).toBe(true);
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
  });
});

describe("design tokens", () => {
  it("define the same judge colors as JUDGES", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    for (const judge of JUDGES) {
      expect(css).toContain(`--judge-${judge.id}: ${judge.color};`);
    }
  });
});
