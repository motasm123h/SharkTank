import type {
  DebateTurn,
  JudgeId,
  Locale,
  Question,
  Report,
  SessionEvent,
  SpeechKind,
  Verdict,
} from "@/domain";
import type { EngineContext, RunOptions, SessionEngine } from "../types";
import { localize } from "./localize";
import type { MockScenario } from "./scenario";
import { MOCK_SCENARIOS, pickScenario } from "./scenarios";

export type MockPacing = {
  /** Delay between streamed words. */
  wordMs: number;
  /** Pause between beats (after a speech, between judges). */
  beatMs: number;
};

export const DEFAULT_PACING: MockPacing = { wordMs: 55, beatMs: 700 };
/** No delays at all, for tests. */
export const INSTANT_PACING: MockPacing = { wordMs: 0, beatMs: 0 };

type Emit = AsyncGenerator<SessionEvent, void, undefined>;

/** Replays pre-written scenarios with realistic streaming delays. Needs no API key. */
export class MockEngine implements SessionEngine {
  readonly name = "mock";

  constructor(
    private readonly pacing: MockPacing = DEFAULT_PACING,
    private readonly scenarios: readonly MockScenario[] = MOCK_SCENARIOS,
  ) {}

  async *run(context: EngineContext, options: RunOptions = {}): AsyncGenerator<SessionEvent> {
    const { input, transcript: t } = context;
    const scenario = pickScenario(this.scenarios, context.scenarioId, input.country);
    const locale = input.language;
    const signal = options.signal;
    const wait = (ms: number) => sleep(ms, signal);
    const speak = (judgeId: JudgeId, kind: SpeechKind, text: string, speechId: string) =>
      this.speak(judgeId, kind, text, speechId, wait);

    if (t.answers.length < t.questions.length) {
      yield {
        type: "error",
        code: "awaiting_answer",
        message: "The last question has not been answered yet",
        retryable: false,
      };
      return;
    }

    if (t.report) {
      yield { type: "phase", phase: "done" };
      return;
    }

    // ---- Q&A ----
    if (t.questions.length === 0) {
      yield { type: "phase", phase: "entrance" };
      await wait(this.pacing.beatMs * 3);
      yield { type: "phase", phase: "qa" };
    } else if (t.debate.length === 0) {
      const index = t.questions.length - 1;
      const asked = scenario.questions[index];
      if (asked) {
        const judgeId = asked.judgeId;
        yield* speak(judgeId, "ack", asked.ack[locale], `ack-${index}`);
        for (const [other, state] of Object.entries(asked.reactions)) {
          yield { type: "judge_state", judgeId: other as JudgeId, state };
        }
        await wait(this.pacing.beatMs);
        yield* this.resetStates(Object.keys(asked.reactions) as JudgeId[]);
      }
    }

    const next = scenario.questions[t.questions.length];
    if (next && t.debate.length === 0) {
      const question = localize<Question>(next, locale);
      yield* speak(question.judgeId, "question", question.text, question.id);
      yield { type: "question", question };
      yield { type: "await_answer", questionId: question.id };
      return;
    }

    // ---- Debate ----
    yield { type: "phase", phase: "debate" };
    for (const raw of scenario.debate) {
      const turn = localize<DebateTurn>(raw, locale);
      yield* speak(turn.judgeId, "debate", turn.text, turn.id);
      yield { type: "debate_turn", turn };
      if (turn.replyTo && turn.stance !== "opens") {
        const reaction = turn.stance === "disagrees" ? "skeptical" : "happy";
        yield { type: "judge_state", judgeId: turn.replyTo.judgeId, state: reaction };
        await wait(this.pacing.beatMs / 2);
        yield { type: "judge_state", judgeId: turn.replyTo.judgeId, state: "idle" };
      }
    }

    // ---- Verdicts ----
    yield { type: "phase", phase: "verdict" };
    for (const raw of scenario.verdicts) {
      const verdict = localize<Verdict>(raw, locale);
      yield* speak(verdict.judgeId, "verdict", verdict.reason, `verdict-${verdict.judgeId}`);
      yield { type: "verdict", verdict };
      yield { type: "judge_state", judgeId: verdict.judgeId, state: verdict.decision };
      await wait(this.pacing.beatMs);
    }

    const report = localizeReport(scenario, locale);
    yield { type: "score", overallScore: report.overallScore };
    await wait(this.pacing.beatMs * 2);

    // ---- Report ----
    yield { type: "phase", phase: "report" };
    yield { type: "report", report };
    yield { type: "phase", phase: "done" };
  }

  private async *speak(
    judgeId: JudgeId,
    kind: SpeechKind,
    text: string,
    speechId: string,
    wait: (ms: number) => Promise<void>,
  ): Emit {
    yield { type: "judge_state", judgeId, state: "thinking" };
    await wait(this.pacing.beatMs);
    yield { type: "judge_state", judgeId, state: "talking" };
    yield { type: "speech_start", speechId, judgeId, kind };
    for (const word of text.match(/\S+\s*/g) ?? []) {
      await wait(this.pacing.wordMs);
      yield { type: "speech_delta", speechId, delta: word };
    }
    yield { type: "speech_end", speechId };
    if (kind !== "verdict") yield { type: "judge_state", judgeId, state: "idle" };
  }

  private async *resetStates(judges: JudgeId[]): Emit {
    for (const judgeId of judges) yield { type: "judge_state", judgeId, state: "idle" };
  }
}

export function localizeReport(scenario: MockScenario, locale: Locale): Report {
  return localize<Report>(scenario.report, locale);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
