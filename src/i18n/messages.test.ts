import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? "").sort();
}

describe("translations", () => {
  it("have the same keys in English and Arabic", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });

  it("use the same {placeholders} in both languages", () => {
    const get = (obj: unknown, path: string) =>
      path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj);
    for (const key of keys(en)) {
      expect(placeholders(String(get(ar, key))), key).toEqual(placeholders(String(get(en, key))));
    }
  });

  it("have no empty strings", () => {
    const get = (obj: unknown, path: string) =>
      path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj);
    for (const key of keys(en)) {
      expect(String(get(en, key)).trim(), key).not.toBe("");
      expect(String(get(ar, key)).trim(), key).not.toBe("");
    }
  });
});
