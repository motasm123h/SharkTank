import { z } from "zod";
import { scoreSchema } from "./common";
import { JudgeIdSchema, JudgeStateSchema } from "./judges";
import { ReportSchema } from "./report";
import { DebateStanceSchema, DebateTurnSchema, QuestionSchema, VerdictSchema } from "./session";

export const SessionPhaseSchema = z.enum(["entrance", "qa", "debate", "verdict", "report", "done"]);
export type SessionPhase = z.infer<typeof SessionPhaseSchema>;

export const SpeechKindSchema = z.enum(["question", "ack", "debate", "verdict"]);
export type SpeechKind = z.infer<typeof SpeechKindSchema>;

/**
 * The stream a SessionEngine emits. The scene only ever consumes these events,
 * so mock and real engines are interchangeable.
 *
 * A speech is streamed as speech_start → speech_delta* → speech_end, followed by
 * the structured item it produced (question, debate_turn or verdict).
 */
export const SessionEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("phase"), phase: SessionPhaseSchema }),
  z.object({ type: z.literal("judge_state"), judgeId: JudgeIdSchema, state: JudgeStateSchema }),
  z.object({
    type: z.literal("speech_start"),
    speechId: z.string().min(1),
    judgeId: JudgeIdSchema,
    kind: SpeechKindSchema,
    /** Debate only: known up front so the scene can show who is answering whom while it streams. */
    stance: DebateStanceSchema.optional(),
    replyTo: z.object({ turnId: z.string().min(1), judgeId: JudgeIdSchema }).optional(),
  }),
  z.object({ type: z.literal("speech_delta"), speechId: z.string().min(1), delta: z.string() }),
  z.object({ type: z.literal("speech_end"), speechId: z.string().min(1) }),
  z.object({ type: z.literal("question"), question: QuestionSchema }),
  z.object({ type: z.literal("await_answer"), questionId: z.string().min(1) }),
  z.object({ type: z.literal("debate_turn"), turn: DebateTurnSchema }),
  z.object({ type: z.literal("verdict"), verdict: VerdictSchema }),
  z.object({ type: z.literal("score"), overallScore: scoreSchema(100) }),
  z.object({ type: z.literal("report"), report: ReportSchema }),
  z.object({
    type: z.literal("error"),
    code: z.enum([
      "awaiting_answer",
      "invalid_transcript",
      "provider_error",
      // Every model is busy or out of quota for now; retrying later can work.
      "provider_busy",
      "budget_exceeded",
    ]),
    message: z.string(),
    retryable: z.boolean(),
  }),
]);
export type SessionEvent = z.infer<typeof SessionEventSchema>;
