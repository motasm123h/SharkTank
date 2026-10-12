import { describe, expect, it } from "vitest";
import type { PitchInput, Source } from "@/domain";
import { UnusableOutputError } from "./classify";
import { buildDebate, buildReport, buildVerdicts, clip, type ReportDraft } from "./drafts";

const input: PitchInput = {
  idea: "An app where students in Mumbai get homework doubts solved in minutes",
  country: "IN",
  city: "Mumbai",
  budget: { min: 200000, max: 500000, currency: "INR" },
  mode: "online",
  stage: "idea",
  language: "en",
};

const scenario = (start: number) => ({
  monthlyRevenue: Array.from({ length: 12 }, (_, i) => start * (i + 1)),
  assumptions: ["Steady growth"],
});

const draft = (patch: Partial<ReportDraft> = {}): ReportDraft => ({
  overallScore: 64.4,
  scores: { demand: 8, competition: 3, purchasingPower: 5, easeOfLaunch: 7, scalability: 12 },
  canSell: { verdict: "conditional", summary: "It can sell if tutors stay fast." },
  salesPlan: {
    price: 49.6,
    pricingRationale: "Below a coaching hour",
    channels: ["Coaching centres"],
    firstCustomers: ["Class 10 students in Andheri"],
  },
  whatMustChange: [],
  keyFigures: [
    {
      label: "Price per doubt",
      value: 49,
      unit: "currency",
      low: 39,
      high: 59,
      note: "",
      sourceIndex: -1,
    },
    {
      label: "Students reached",
      value: 12000,
      unit: "count",
      low: 12000,
      high: 12000,
      note: "",
      sourceIndex: 0,
    },
  ],
  salesScenarios: {
    pessimistic: scenario(1000),
    realistic: scenario(3000),
    optimistic: scenario(6000),
  },
  successReasons: ["Exam pressure"],
  failureReasons: ["Free alternatives"],
  marketing: {
    summary: "Start offline, then referrals.",
    channels: [
      {
        channel: "referrals",
        monthlyBudget: 5000,
        expectedCac: 0,
        rationale: "Word of mouth",
        priority: 2,
      },
      {
        channel: "offline",
        monthlyBudget: 15000,
        expectedCac: 120,
        rationale: "Coaching centres",
        priority: 1,
      },
      {
        channel: "offline",
        monthlyBudget: 999,
        expectedCac: 1,
        rationale: "Duplicate",
        priority: 3,
      },
    ],
  },
  location: { recommendation: "online", rationale: "App first" },
  timing: { verdict: "right_time", rationale: "Phones everywhere", signals: ["UPI"] },
  localContext: { paymentMethods: ["UPI"], platforms: ["WhatsApp"], realities: ["Exam seasons"] },
  globalFit: [
    { country: "eg", fit: 61, reason: "Similar exam culture" },
    { country: "IN", fit: 90, reason: "Home country is excluded" },
    { country: "XX", fit: 50, reason: "Not a country" },
    { country: "EG", fit: 40, reason: "Duplicate" },
  ],
  similarIdeas: [
    {
      name: "Filo",
      description: "Instant tutoring",
      country: "IN",
      status: "active",
      sourceIndex: -1,
    },
    {
      name: "Doubtnut",
      description: "Doubt solving",
      country: "IN",
      status: "active",
      sourceIndex: 0,
    },
  ],
  improvements: ["Add exam packs"],
  nextSteps: [
    { title: "Talk to 20 students", detail: "This week" },
    { title: "Sign 5 tutors", detail: "Verified" },
    { title: "Pilot in one school", detail: "Two weeks" },
  ],
  ...patch,
});

const sources: Source[] = [{ title: "Example source", url: "https://example.com/a" }];

describe("buildReport", () => {
  it("builds a valid report with units, currency and estimates filled in by code", () => {
    const report = buildReport(draft(), input, []);
    expect(report.overallScore).toEqual({ value: 64, unit: "score", isEstimate: true });
    expect(report.scoreBreakdown.scalability.value).toBe(10);
    expect(report.salesPlan?.price).toEqual({
      value: 50,
      unit: "currency",
      currency: "INR",
      isEstimate: true,
    });
    expect(report.salesScenarios.map((s) => s.monthly.length)).toEqual([12, 12, 12]);
  });

  it("orders marketing channels by priority, drops duplicates and sums the budget", () => {
    const { marketing } = buildReport(draft(), input, []);
    expect(marketing.channels.map((c) => [c.channel, c.priority])).toEqual([
      ["offline", 1],
      ["referrals", 2],
    ]);
    expect(marketing.channels[1]!.expectedCac).toBeUndefined();
    expect(marketing.totalMonthlyBudget.value).toBe(20000);
  });

  it("keeps only real, distinct countries other than the founder's own", () => {
    const { globalFit } = buildReport(draft(), input, []);
    expect(globalFit.map((g) => g.country)).toEqual(["EG"]);
  });

  it("never turns a number into a fact without a source we actually received", () => {
    const withoutSearch = buildReport(draft(), input, []);
    expect(withoutSearch.keyFigures.every((k) => k.figure.isEstimate)).toBe(true);
    expect(withoutSearch.similarIdeas.every((s) => s.status === "unknown" && !s.url)).toBe(true);

    const withSearch = buildReport(draft(), input, sources);
    expect(withSearch.keyFigures[1]!.figure).toMatchObject({
      isEstimate: false,
      source: sources[0],
    });
    expect(withSearch.similarIdeas[1]).toMatchObject({
      status: "active",
      url: "https://example.com/a",
    });
    expect(withSearch.similarIdeas[0]!.status).toBe("unknown");
  });

  it("drops the sales plan for a 'no' and still says what must change", () => {
    const report = buildReport(
      draft({ canSell: { verdict: "no", summary: "Not as it stands." } }),
      input,
      [],
    );
    expect(report.salesPlan).toBeUndefined();
    expect(report.whatMustChange).toEqual(["Add exam packs"]);
  });

  it("rejects a draft that cannot make a valid report", () => {
    expect(() => buildReport(draft({ nextSteps: [] }), input, [])).toThrow(UnusableOutputError);
  });
});

describe("buildDebate", () => {
  it("repairs replies that point at the speaker's own turn or nowhere", () => {
    const turns = buildDebate([
      { judge: "skeptic", stance: "opens", replyTo: -1, text: "Free apps exist." },
      { judge: "investor", stance: "disagrees", replyTo: 0, text: "Speed is the wedge." },
      { judge: "investor", stance: "agrees", replyTo: 1, text: "Pointing at myself." },
      { judge: "finance", stance: "builds_on", replyTo: 9, text: "Pointing nowhere." },
    ]);
    expect(turns.map((t) => t.id)).toEqual(["d1", "d2", "d3", "d4"]);
    expect(turns[0]).not.toHaveProperty("replyTo");
    expect(turns[2]!.replyTo).toEqual({ turnId: "d1", judgeId: "skeptic" });
    expect(turns[3]!.replyTo).toEqual({ turnId: "d3", judgeId: "investor" });
  });

  it("rejects a debate that is too short", () => {
    expect(() =>
      buildDebate([{ judge: "skeptic", stance: "opens", replyTo: -1, text: "Hm." }]),
    ).toThrow(UnusableOutputError);
  });
});

describe("buildVerdicts", () => {
  it("needs exactly one verdict per judge and shortens long reasons", () => {
    const long = "word ".repeat(80);
    const verdicts = buildVerdicts(
      (["investor", "local", "marketing", "finance", "skeptic"] as const).map((judge) => ({
        judge,
        decision: "in" as const,
        reason: long,
      })),
    );
    expect(verdicts).toHaveLength(5);
    expect(verdicts[0]!.reason.length).toBeLessThanOrEqual(200);
    expect(() => buildVerdicts([])).toThrow(/no verdict/);
  });
});

describe("clip", () => {
  it("cuts at a word boundary", () => {
    expect(clip("one two three four", 12)).toBe("one two…");
  });
});
