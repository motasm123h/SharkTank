import { describe, expect, it } from "vitest";
import {
  CompletedSessionSchema,
  DebateTurnSchema,
  FigureSchema,
  PitchInputSchema,
  SessionEventSchema,
} from "@/domain";

describe("FigureSchema (honesty rule)", () => {
  it("accepts an estimate without a source", () => {
    expect(FigureSchema.safeParse({ value: 5, unit: "count", isEstimate: true }).success).toBe(
      true,
    );
  });

  it("rejects a fact without a source", () => {
    const result = FigureSchema.safeParse({ value: 5, unit: "count", isEstimate: false });
    expect(result.error?.issues[0]?.path).toEqual(["source"]);
  });

  it("accepts a fact with a source", () => {
    const fact = { value: 5, unit: "count", isEstimate: false, source: { title: "Census" } };
    expect(FigureSchema.safeParse(fact).success).toBe(true);
  });

  it("requires a currency exactly for money", () => {
    expect(FigureSchema.safeParse({ value: 5, unit: "currency", isEstimate: true }).success).toBe(
      false,
    );
    expect(
      FigureSchema.safeParse({ value: 5, unit: "count", currency: "USD", isEstimate: true })
        .success,
    ).toBe(false);
  });

  it("keeps value inside its range", () => {
    const f = { value: 50, unit: "count", isEstimate: true, low: 60, high: 80 };
    expect(FigureSchema.safeParse(f).success).toBe(false);
  });
});

describe("PitchInputSchema", () => {
  const valid = {
    idea: "A meal-prep delivery service for busy professionals",
    country: "SY",
    city: "Damascus",
    budget: { min: 1000, max: 5000, currency: "USD" },
    mode: "online",
    stage: "idea",
    language: "ar",
  };

  it("accepts a valid pitch", () => {
    expect(PitchInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["idea too short", { idea: "Food" }],
    ["lowercase country", { country: "sy" }],
    ["unknown language", { language: "fr" }],
    ["budget min above max", { budget: { min: 9000, max: 5000, currency: "USD" } }],
  ])("rejects %s", (_label, patch) => {
    expect(PitchInputSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("DebateTurnSchema", () => {
  it("requires replyTo for replies and forbids replying to yourself", () => {
    const base = { id: "d2", judgeId: "skeptic", text: "No." };
    expect(DebateTurnSchema.safeParse({ ...base, stance: "disagrees" }).success).toBe(false);
    expect(
      DebateTurnSchema.safeParse({
        ...base,
        stance: "disagrees",
        replyTo: { turnId: "d1", judgeId: "skeptic" },
      }).success,
    ).toBe(false);
    expect(
      DebateTurnSchema.safeParse({
        ...base,
        stance: "disagrees",
        replyTo: { turnId: "d1", judgeId: "investor" },
      }).success,
    ).toBe(true);
  });
});

describe("CompletedSessionSchema", () => {
  it("rejects an empty session with a clear list of problems", () => {
    const result = CompletedSessionSchema.safeParse({
      input: {
        idea: "A meal-prep delivery service for busy professionals",
        country: "SY",
        city: "Damascus",
        budget: { min: 1000, max: 5000, currency: "USD" },
        mode: "online",
        stage: "idea",
        language: "en",
      },
      transcript: { questions: [], answers: [], debate: [], verdicts: [] },
    });
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Debate is too short");
    expect(messages).toContain("Exactly one verdict per judge");
    expect(messages).toContain("Missing report");
  });
});

describe("SessionEventSchema", () => {
  it("rejects unknown event types", () => {
    expect(SessionEventSchema.safeParse({ type: "dance" }).success).toBe(false);
  });
});
