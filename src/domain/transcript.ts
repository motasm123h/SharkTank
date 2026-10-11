import { z } from "zod";
import { JUDGE_IDS } from "./judges";
import { PitchInputSchema } from "./pitch";
import { ReportSchema } from "./report";
import { AnswerSchema, DebateTurnSchema, QuestionSchema, VerdictSchema } from "./session";

/** Everything that has happened in a session so far. Engines continue from it. */
export const TranscriptSchema = z.object({
  questions: z.array(QuestionSchema),
  answers: z.array(AnswerSchema),
  debate: z.array(DebateTurnSchema),
  verdicts: z.array(VerdictSchema),
  report: ReportSchema.optional(),
});
export type Transcript = z.infer<typeof TranscriptSchema>;

export const EMPTY_TRANSCRIPT: Transcript = {
  questions: [],
  answers: [],
  debate: [],
  verdicts: [],
};

export const QUESTIONS_PER_JUDGE = { min: 1, max: 2 } as const;
export const MIN_DEBATE_TURNS = 4;

/** A finished session: every rule of the show is checked here. */
export const CompletedSessionSchema = z
  .object({ input: PitchInputSchema, transcript: TranscriptSchema })
  .superRefine(({ transcript: t }, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path: ["transcript", ...path], message });

    for (const judgeId of JUDGE_IDS) {
      const asked = t.questions.filter((q) => q.judgeId === judgeId).length;
      if (asked < QUESTIONS_PER_JUDGE.min || asked > QUESTIONS_PER_JUDGE.max) {
        issue(["questions"], `${judgeId} must ask 1–2 questions (asked ${asked})`);
      }
    }

    const questionIds = t.questions.map((q) => q.id);
    if (new Set(questionIds).size !== questionIds.length) issue(["questions"], "Duplicate ids");
    t.questions.forEach((q, i) => {
      if (t.answers[i]?.questionId !== q.id) issue(["answers", i], `No answer for ${q.id}`);
    });
    if (t.answers.length !== t.questions.length) issue(["answers"], "Answer count mismatch");

    if (t.debate.length < MIN_DEBATE_TURNS) issue(["debate"], "Debate is too short");
    t.debate.forEach((turn, i) => {
      if (!turn.replyTo) return;
      const target = t.debate.slice(0, i).find((d) => d.id === turn.replyTo?.turnId);
      if (!target) issue(["debate", i], "replyTo must point to an earlier turn");
      else if (target.judgeId !== turn.replyTo.judgeId) {
        issue(["debate", i], "replyTo.judgeId does not match the earlier turn");
      }
    });

    const verdictJudges = t.verdicts.map((v) => v.judgeId).sort();
    if (verdictJudges.join() !== [...JUDGE_IDS].sort().join()) {
      issue(["verdicts"], "Exactly one verdict per judge");
    }
    if (!t.report) issue(["report"], "Missing report");
  });
export type CompletedSession = z.infer<typeof CompletedSessionSchema>;
