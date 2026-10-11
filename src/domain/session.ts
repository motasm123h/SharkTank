import { z } from "zod";
import { TextSchema } from "./common";
import { JudgeIdSchema } from "./judges";

export const QuestionSchema = z.object({
  id: z.string().min(1),
  judgeId: JudgeIdSchema,
  text: TextSchema.max(600),
});
export type Question = z.infer<typeof QuestionSchema>;

export const ANSWER_MAX_LENGTH = 2000;

export const AnswerSchema = z.object({
  questionId: z.string().min(1),
  text: TextSchema.max(ANSWER_MAX_LENGTH),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const DebateStanceSchema = z.enum(["opens", "agrees", "disagrees", "builds_on"]);
export type DebateStance = z.infer<typeof DebateStanceSchema>;

/** One debate message. `replyTo` makes "who answers whom" explicit for the UI. */
export const DebateTurnSchema = z
  .object({
    id: z.string().min(1),
    judgeId: JudgeIdSchema,
    text: TextSchema.max(600),
    stance: DebateStanceSchema,
    replyTo: z.object({ turnId: z.string().min(1), judgeId: JudgeIdSchema }).optional(),
  })
  .superRefine((turn, ctx) => {
    if (turn.stance !== "opens" && !turn.replyTo) {
      ctx.addIssue({ code: "custom", path: ["replyTo"], message: "A reply needs replyTo" });
    }
    if (turn.stance === "opens" && turn.replyTo) {
      ctx.addIssue({
        code: "custom",
        path: ["replyTo"],
        message: "An opening turn has no replyTo",
      });
    }
    if (turn.replyTo?.judgeId === turn.judgeId) {
      ctx.addIssue({
        code: "custom",
        path: ["replyTo"],
        message: "A judge cannot reply to itself",
      });
    }
  });
export type DebateTurn = z.infer<typeof DebateTurnSchema>;

export const VerdictSchema = z.object({
  judgeId: JudgeIdSchema,
  decision: z.enum(["in", "out"]),
  reason: TextSchema.max(200),
});
export type Verdict = z.infer<typeof VerdictSchema>;
