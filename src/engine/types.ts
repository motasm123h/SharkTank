import type { PitchInput, SessionEvent, Transcript } from "@/domain";

export type EngineContext = {
  input: PitchInput;
  transcript: Transcript;
  /** Mock only: pin a demo scenario instead of matching by country. */
  scenarioId?: string;
};

export type RunOptions = { signal?: AbortSignal };

/**
 * Produces the panel's side of a session.
 *
 * `run` is stateless: it reads the transcript, continues from where it ends and
 * stops after emitting `await_answer` (the user must reply) or `phase: done`.
 * The caller appends the user's answer to the transcript and calls `run` again.
 */
export interface SessionEngine {
  readonly name: string;
  run(context: EngineContext, options?: RunOptions): AsyncIterable<SessionEvent>;
}
