import { z } from "zod";
import {
  CountryCodeSchema,
  FigureSchema,
  MoneySchema,
  SourceSchema,
  TextSchema,
  scoreSchema,
} from "./common";
import { BusinessModeSchema } from "./pitch";

const Score10 = scoreSchema(10);
const Score100 = scoreSchema(100);
const TextList = z.array(TextSchema);

/** Radar dimensions. For every dimension, higher is better for the idea (e.g. high competition score = little competition). */
export const SCORE_DIMENSIONS = [
  "demand",
  "competition",
  "purchasingPower",
  "easeOfLaunch",
  "scalability",
] as const;

export const ScoreBreakdownSchema = z.object({
  demand: Score10,
  competition: Score10,
  purchasingPower: Score10,
  easeOfLaunch: Score10,
  scalability: Score10,
});

export const SalesScenarioKindSchema = z.enum(["pessimistic", "realistic", "optimistic"]);
export type SalesScenarioKind = z.infer<typeof SalesScenarioKindSchema>;

export const SalesScenarioSchema = z.object({
  kind: SalesScenarioKindSchema,
  monthly: z
    .array(z.object({ month: z.number().int().min(1).max(36), revenue: MoneySchema }))
    .min(3),
  assumptions: TextList.min(1),
});
export type SalesScenario = z.infer<typeof SalesScenarioSchema>;

export const MarketingChannelIdSchema = z.enum([
  "meta_ads",
  "influencers",
  "whatsapp",
  "tiktok",
  "google_ads",
  "seo_content",
  "offline",
  "partnerships",
  "referrals",
]);
export type MarketingChannelId = z.infer<typeof MarketingChannelIdSchema>;

export const MarketingChannelSchema = z.object({
  channel: MarketingChannelIdSchema,
  monthlyBudget: MoneySchema,
  expectedCac: MoneySchema.optional(),
  rationale: TextSchema,
  /** 1 = do this first. */
  priority: z.number().int().min(1),
});
export type MarketingChannel = z.infer<typeof MarketingChannelSchema>;

export const TimingVerdictSchema = z.enum(["too_early", "right_time", "late"]);
export type TimingVerdict = z.infer<typeof TimingVerdictSchema>;

export const SimilarIdeaSchema = z.object({
  name: TextSchema,
  description: TextSchema,
  country: CountryCodeSchema.optional(),
  url: z.url().optional(),
  status: z.enum(["active", "closed", "unknown"]),
  source: SourceSchema.optional(),
});
export type SimilarIdea = z.infer<typeof SimilarIdeaSchema>;

export const ReportSchema = z
  .object({
    overallScore: Score100,
    scoreBreakdown: ScoreBreakdownSchema,
    canSell: z.object({
      verdict: z.enum(["yes", "conditional", "no"]),
      summary: TextSchema,
    }),
    /** Present when the idea can sell: how, at what price, to whom first. */
    salesPlan: z
      .object({
        price: MoneySchema,
        pricingRationale: TextSchema,
        channels: TextList.min(1),
        firstCustomers: TextList.min(1),
      })
      .optional(),
    /** What would have to change. Required when the verdict is "no". */
    whatMustChange: TextList,
    keyFigures: z.array(z.object({ label: TextSchema, figure: FigureSchema })),
    salesScenarios: z.array(SalesScenarioSchema).length(3),
    successReasons: TextList.min(1),
    failureReasons: TextList.min(1),
    marketing: z.object({
      summary: TextSchema,
      channels: z.array(MarketingChannelSchema).min(1),
      totalMonthlyBudget: MoneySchema,
    }),
    location: z.object({ recommendation: BusinessModeSchema, rationale: TextSchema }),
    timing: z.object({
      verdict: TimingVerdictSchema,
      rationale: TextSchema,
      signals: TextList.min(1),
    }),
    localContext: z.object({
      paymentMethods: TextList.min(1),
      platforms: TextList.min(1),
      realities: TextList.min(1),
    }),
    globalFit: z
      .array(z.object({ country: CountryCodeSchema, fit: Score100, reason: TextSchema }))
      .min(1),
    similarIdeas: z.array(SimilarIdeaSchema),
    improvements: TextList.min(1),
    nextSteps: z.array(z.object({ title: TextSchema, detail: TextSchema })).length(3),
  })
  .superRefine((r, ctx) => {
    if (r.canSell.verdict !== "no" && !r.salesPlan) {
      ctx.addIssue({
        code: "custom",
        path: ["salesPlan"],
        message: "Required unless verdict is no",
      });
    }
    if (r.canSell.verdict === "no" && r.whatMustChange.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["whatMustChange"],
        message: "Say what must change when the verdict is no",
      });
    }
    const kinds = new Set(r.salesScenarios.map((s) => s.kind));
    if (kinds.size !== 3) {
      ctx.addIssue({
        code: "custom",
        path: ["salesScenarios"],
        message: "Need one pessimistic, one realistic and one optimistic scenario",
      });
    }
    const countries = r.globalFit.map((g) => g.country);
    if (new Set(countries).size !== countries.length) {
      ctx.addIssue({ code: "custom", path: ["globalFit"], message: "Duplicate country" });
    }
  });
export type Report = z.infer<typeof ReportSchema>;
