import countries from "i18n-iso-countries";
import { z } from "zod";
import {
  DebateStanceSchema,
  JUDGE_IDS,
  JudgeIdSchema,
  MIN_DEBATE_TURNS,
  ReportSchema,
  type DebateTurn,
  type Figure,
  type JudgeId,
  type MarketingChannel,
  type PitchInput,
  type Report,
  type SalesScenarioKind,
  type Source,
  type Verdict,
} from "@/domain";
import { UnusableOutputError } from "./classify";

/*
 * What models fill in. Deliberately flat and permissive (no regexes, formats or
 * length rules, which some providers reject): the builders below check every
 * rule and turn drafts into the strict domain types.
 */

const Judge = z.enum(JUDGE_IDS);
const Reaction = z.enum(["happy", "skeptical", "thinking", "idle"]);

export const OpeningQuestionDraftSchema = z.object({
  question: z.string().describe("The question, one or two sentences"),
});

export const NextQuestionDraftSchema = z.object({
  reaction: Reaction.describe("How the judge who asked the last question feels about the answer"),
  ack: z.string().describe("That judge's short spoken reaction to the answer, one sentence"),
  question: z.string().describe("The next judge's question, one or two sentences"),
});

export const AckDraftSchema = NextQuestionDraftSchema.pick({ reaction: true, ack: true });

const VerdictDraft = z.object({
  judge: Judge,
  decision: z.enum(["in", "out"]),
  reason: z.string().describe("Why, in one short sentence (under 25 words)"),
});

export const DeliberationDraftSchema = z.object({
  debate: z
    .array(
      z.object({
        judge: Judge,
        stance: DebateStanceSchema.describe(
          "'opens' only for a new point; otherwise how it relates",
        ),
        replyTo: z
          .number()
          .int()
          .describe("Index (0-based) of the earlier turn this answers, or -1 when opening"),
        text: z.string().describe("One or two spoken sentences"),
      }),
    )
    .describe("6 to 8 turns; judges answer each other by name of idea, not by repeating it"),
  verdicts: z.array(VerdictDraft).describe("Exactly one per judge"),
});
export type DeliberationDraft = z.infer<typeof DeliberationDraftSchema>;

export const VerdictsDraftSchema = DeliberationDraftSchema.pick({ verdicts: true });

const Money = z.number().describe("Amount in the report currency");
const Texts = z.array(z.string());
const Scenario = z.object({
  monthlyRevenue: z.array(Money).describe("Revenue for months 1 to 12"),
  assumptions: Texts,
});

export const ReportDraftSchema = z.object({
  overallScore: z.number().describe("0 to 100"),
  scores: z.object({
    demand: z.number().describe("0-10, higher is better"),
    competition: z.number().describe("0-10, higher means LESS competition"),
    purchasingPower: z.number().describe("0-10"),
    easeOfLaunch: z.number().describe("0-10"),
    scalability: z.number().describe("0-10"),
  }),
  canSell: z.object({ verdict: z.enum(["yes", "conditional", "no"]), summary: z.string() }),
  salesPlan: z.object({
    price: Money,
    pricingRationale: z.string(),
    channels: Texts,
    firstCustomers: Texts,
  }),
  whatMustChange: Texts,
  keyFigures: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        unit: z.enum(["currency", "percent", "count", "months"]),
        low: z.number().describe("Lower end of the estimate (same as value if none)"),
        high: z.number().describe("Upper end of the estimate (same as value if none)"),
        note: z.string().describe("Short note, or empty"),
        sourceIndex: z
          .number()
          .int()
          .describe("Index in SOURCES when this is a sourced fact, else -1"),
      }),
    )
    .describe("4 to 6 key numbers"),
  salesScenarios: z.object({ pessimistic: Scenario, realistic: Scenario, optimistic: Scenario }),
  successReasons: Texts,
  failureReasons: Texts,
  marketing: z.object({
    summary: z.string(),
    channels: z.array(
      z.object({
        channel: z.enum([
          "meta_ads",
          "influencers",
          "whatsapp",
          "tiktok",
          "google_ads",
          "seo_content",
          "offline",
          "partnerships",
          "referrals",
        ]),
        monthlyBudget: Money,
        expectedCac: Money.describe("Expected cost to win one customer, 0 if unknown"),
        rationale: z.string(),
        priority: z.number().int().describe("1 = do first"),
      }),
    ),
  }),
  location: z.object({
    recommendation: z.enum(["online", "physical", "hybrid"]),
    rationale: z.string(),
  }),
  timing: z.object({
    verdict: z.enum(["too_early", "right_time", "late"]),
    rationale: z.string(),
    signals: Texts,
  }),
  localContext: z.object({ paymentMethods: Texts, platforms: Texts, realities: Texts }),
  globalFit: z
    .array(
      z.object({
        country: z.string().describe("ISO 3166-1 alpha-2 code, e.g. EG"),
        fit: z.number().describe("0-100"),
        reason: z.string(),
      }),
    )
    .describe("4 to 6 other countries where this could work, plus how well"),
  similarIdeas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      country: z.string().describe("ISO alpha-2 code, or empty"),
      status: z.enum(["active", "closed", "unknown"]).describe("'unknown' unless you are sure"),
      sourceIndex: z.number().int().describe("Index in SOURCES that mentions it, else -1"),
    }),
  ),
  improvements: Texts,
  nextSteps: z.array(z.object({ title: z.string(), detail: z.string() })).describe("Exactly 3"),
});
export type ReportDraft = z.infer<typeof ReportDraftSchema>;

// ---------- builders ----------

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const list = (items: readonly string[]) => items.map(clean).filter(Boolean);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Shortens to `max` characters at a word boundary. */
export function clip(text: string, max: number): string {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,.،؛:;-]+$/, "")}…`;
}

function required(text: string, what: string): string {
  const t = clean(text);
  if (!t) throw new UnusableOutputError(`empty ${what}`);
  return t;
}

export function buildQuestionText(text: string): string {
  return clip(required(text, "question"), 600);
}

/**
 * Turns drafted debate turns into domain turns, repairing who-answers-whom
 * when a model points at the wrong turn instead of throwing the debate away.
 */
export function buildDebate(draft: DeliberationDraft["debate"]): DebateTurn[] {
  const turns: DebateTurn[] = [];
  for (const d of draft) {
    const text = clean(d.text);
    if (!text || !JudgeIdSchema.safeParse(d.judge).success) continue;
    const id = `d${turns.length + 1}`;
    const earlier = (i: number) => (i >= 0 && i < turns.length ? turns[i] : undefined);
    let target = d.stance === "opens" ? undefined : earlier(d.replyTo);
    if (d.stance !== "opens" && (!target || target.judgeId === d.judge)) {
      target = turns.findLast((t) => t.judgeId !== d.judge);
    }
    turns.push(
      target
        ? {
            id,
            judgeId: d.judge,
            text: clip(text, 600),
            stance: d.stance === "opens" ? "builds_on" : d.stance,
            replyTo: { turnId: target.id, judgeId: target.judgeId },
          }
        : { id, judgeId: d.judge, text: clip(text, 600), stance: "opens" },
    );
  }
  if (turns.length < MIN_DEBATE_TURNS) {
    throw new UnusableOutputError(`debate too short (${turns.length} turns)`);
  }
  return turns;
}

export function buildVerdicts(draft: DeliberationDraft["verdicts"]): Verdict[] {
  const byJudge = new Map<JudgeId, Verdict>();
  for (const v of draft) {
    const reason = clean(v.reason);
    if (!reason || byJudge.has(v.judge)) continue;
    byJudge.set(v.judge, { judgeId: v.judge, decision: v.decision, reason: clip(reason, 200) });
  }
  const missing = JUDGE_IDS.filter((id) => !byJudge.has(id));
  if (missing.length > 0) throw new UnusableOutputError(`no verdict from ${missing.join(", ")}`);
  return JUDGE_IDS.map((id) => byJudge.get(id)!);
}

const isCountry = (code: string) => /^[A-Z]{2}$/.test(code) && countries.isValid(code);

/**
 * Builds the strict report from a draft. Every number is an estimate unless the
 * model tied it to one of the search results we actually received.
 */
export function buildReport(
  draft: ReportDraft,
  input: PitchInput,
  sources: readonly Source[],
): Report {
  const currency = input.budget.currency;
  const sourceAt = (i: number) => (Number.isInteger(i) && i >= 0 ? sources[i] : undefined);
  const money = (value: number): Figure => ({
    value: Math.max(0, Math.round(value)),
    unit: "currency",
    currency,
    isEstimate: true,
  });
  const score = (value: number, max: number): Figure => ({
    value: Math.round(clamp(value, 0, max)),
    unit: "score",
    isEstimate: true,
  });

  const verdict = draft.canSell.verdict;
  const improvements = list(draft.improvements);
  const whatMustChange = list(draft.whatMustChange);

  const keyFigures = draft.keyFigures.flatMap((k) => {
    const label = clean(k.label);
    if (!label || !Number.isFinite(k.value)) return [];
    const value = k.unit === "percent" ? k.value : Math.round(k.value);
    const low = Math.min(k.low, value);
    const high = Math.max(k.high, value);
    const source = sourceAt(k.sourceIndex);
    const figure: Figure = {
      value,
      unit: k.unit,
      ...(k.unit === "currency" ? { currency } : {}),
      ...(Number.isFinite(low) && low !== value ? { low } : {}),
      ...(Number.isFinite(high) && high !== value ? { high } : {}),
      ...(clean(k.note) ? { note: clean(k.note) } : {}),
      ...(source ? { isEstimate: false, source } : { isEstimate: true }),
    };
    return [{ label, figure }];
  });

  const scenario = (kind: SalesScenarioKind) => {
    const s = draft.salesScenarios[kind];
    return {
      kind,
      monthly: s.monthlyRevenue
        .filter(Number.isFinite)
        .slice(0, 12)
        .map((revenue, i) => ({ month: i + 1, revenue: money(revenue) })),
      assumptions: list(s.assumptions),
    };
  };

  const seenChannels = new Set<string>();
  const channels: MarketingChannel[] = draft.marketing.channels
    .filter(
      (c) => !seenChannels.has(c.channel) && seenChannels.add(c.channel) && clean(c.rationale),
    )
    .sort((a, b) => a.priority - b.priority)
    .map((c, i) => ({
      channel: c.channel,
      monthlyBudget: money(c.monthlyBudget),
      ...(c.expectedCac > 0 ? { expectedCac: money(c.expectedCac) } : {}),
      rationale: clean(c.rationale),
      priority: i + 1,
    }));

  const seenCountries = new Set<string>([input.country]);
  const globalFit = draft.globalFit.flatMap((g) => {
    const country = clean(g.country).toUpperCase();
    if (!isCountry(country) || seenCountries.has(country) || !clean(g.reason)) return [];
    seenCountries.add(country);
    return [{ country, fit: score(g.fit, 100), reason: clean(g.reason) }];
  });

  const similarIdeas = draft.similarIdeas.flatMap((s) => {
    const name = clean(s.name);
    const description = clean(s.description);
    if (!name || !description) return [];
    const country = clean(s.country).toUpperCase();
    const source = sourceAt(s.sourceIndex);
    return [
      {
        name,
        description,
        ...(isCountry(country) ? { country } : {}),
        // Without a source we cannot vouch for whether it is still running.
        status: source ? s.status : "unknown",
        ...(source ? { source, ...(source.url ? { url: source.url } : {}) } : {}),
      },
    ];
  });

  const report = {
    overallScore: score(draft.overallScore, 100),
    scoreBreakdown: {
      demand: score(draft.scores.demand, 10),
      competition: score(draft.scores.competition, 10),
      purchasingPower: score(draft.scores.purchasingPower, 10),
      easeOfLaunch: score(draft.scores.easeOfLaunch, 10),
      scalability: score(draft.scores.scalability, 10),
    },
    canSell: { verdict, summary: clean(draft.canSell.summary) },
    ...(verdict !== "no"
      ? {
          salesPlan: {
            price: money(draft.salesPlan.price),
            pricingRationale: clean(draft.salesPlan.pricingRationale),
            channels: list(draft.salesPlan.channels),
            firstCustomers: list(draft.salesPlan.firstCustomers),
          },
        }
      : {}),
    whatMustChange:
      verdict === "no" && whatMustChange.length === 0 ? improvements.slice(0, 3) : whatMustChange,
    keyFigures,
    salesScenarios: (["pessimistic", "realistic", "optimistic"] as const).map(scenario),
    successReasons: list(draft.successReasons),
    failureReasons: list(draft.failureReasons),
    marketing: {
      summary: clean(draft.marketing.summary),
      channels,
      totalMonthlyBudget: money(channels.reduce((sum, c) => sum + c.monthlyBudget.value, 0)),
    },
    location: {
      recommendation: draft.location.recommendation,
      rationale: clean(draft.location.rationale),
    },
    timing: {
      verdict: draft.timing.verdict,
      rationale: clean(draft.timing.rationale),
      signals: list(draft.timing.signals),
    },
    localContext: {
      paymentMethods: list(draft.localContext.paymentMethods),
      platforms: list(draft.localContext.platforms),
      realities: list(draft.localContext.realities),
    },
    globalFit,
    similarIdeas,
    improvements,
    nextSteps: draft.nextSteps
      .map((s) => ({ title: clean(s.title), detail: clean(s.detail) }))
      .filter((s) => s.title && s.detail)
      .slice(0, 3),
  };

  const parsed = ReportSchema.safeParse(report);
  if (!parsed.success) {
    const where = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new UnusableOutputError(`report does not fit: ${where}`);
  }
  return parsed.data;
}
