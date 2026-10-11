import {
  EMPTY_TRANSCRIPT,
  SessionEventSchema,
  type PitchInput,
  type SessionEvent,
  type Transcript,
} from "@/domain";
import type { SessionEngine } from "../types";

/**
 * Drives an engine through a whole session the way the app will: run until it
 * asks a question, answer it, run again, until the phase is "done".
 * Every event is validated against SessionEventSchema.
 */
export async function playThrough(
  engine: SessionEngine,
  input: PitchInput,
  options: {
    scenarioId?: string;
    answer?: (questionId: string) => string;
    maxRounds?: number;
  } = {},
): Promise<{ events: SessionEvent[]; transcript: Transcript }> {
  const transcript: Transcript = structuredClone(EMPTY_TRANSCRIPT);
  const events: SessionEvent[] = [];
  const answer = options.answer ?? ((id) => `Test answer for ${id}`);

  for (let round = 0; round < (options.maxRounds ?? 20); round++) {
    let awaiting: string | undefined;
    let done = false;

    for await (const raw of engine.run({ input, transcript, scenarioId: options.scenarioId })) {
      const event = SessionEventSchema.parse(raw);
      events.push(event);
      if (event.type === "question") transcript.questions.push(event.question);
      if (event.type === "await_answer") awaiting = event.questionId;
      if (event.type === "debate_turn") transcript.debate.push(event.turn);
      if (event.type === "verdict") transcript.verdicts.push(event.verdict);
      if (event.type === "report") transcript.report = event.report;
      if (event.type === "phase" && event.phase === "done") done = true;
      if (event.type === "error") throw new Error(`Engine error: ${event.message}`);
    }

    if (done) return { events, transcript };
    if (!awaiting) throw new Error("Engine stopped without asking a question or finishing");
    transcript.answers.push({ questionId: awaiting, text: answer(awaiting) });
  }
  throw new Error("Session did not finish");
}
