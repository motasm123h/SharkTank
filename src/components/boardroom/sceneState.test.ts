import { describe, expect, it } from "vitest";
import { EMPTY_TRANSCRIPT, type PitchInput, type SessionEvent, type Transcript } from "@/domain";
import { localize } from "@/engine/mock/localize";
import { INSTANT_PACING, MockEngine } from "@/engine/mock/MockEngine";
import { MOCK_SCENARIOS } from "@/engine/mock/scenarios";
import { replayTimeline } from "./replay";
import {
  EMPTY_SCENE,
  needsTurn,
  sceneFromTranscript,
  sceneReducer,
  type SceneState,
} from "./sceneState";

const engine = new MockEngine(INSTANT_PACING);
const scenario = MOCK_SCENARIOS[0]!;
const input: PitchInput = {
  ...localize<Omit<PitchInput, "language">>(scenario.input, "en"),
  language: "en",
};

async function collect(transcript: Transcript): Promise<SessionEvent[]> {
  const events: SessionEvent[] = [];
  for await (const e of engine.run({ input, transcript })) events.push(e);
  return events;
}

const fold = (state: SceneState, events: SessionEvent[]) =>
  events.reduce((s, event) => sceneReducer(s, { type: "event", event }), state);

describe("sceneReducer", () => {
  it("plays the entrance and first question, then waits for the user", async () => {
    let state = sceneFromTranscript(EMPTY_TRANSCRIPT);
    expect(state.phase).toBe("loading");
    expect(state.user).toBe("outside");
    expect(needsTurn(state)).toBe(true);

    state = fold(state, await collect(EMPTY_TRANSCRIPT));

    expect(state.phase).toBe("qa");
    expect(state.user).toBe("standing");
    expect(state.awaiting).toBe("q1");
    expect(state.speech).toMatchObject({ judgeId: "investor", kind: "question", done: true });
    expect(state.speech?.text).toBe(state.history[0]?.text);
    expect(state.asked).toEqual(["investor"]);
    expect(state.announcement?.judgeId).toBe("investor");
    expect(needsTurn(state)).toBe(false);
  });

  it("runs a whole Q&A round, one turn per answer", async () => {
    let state = sceneFromTranscript(EMPTY_TRANSCRIPT);
    const transcript: Transcript = structuredClone(EMPTY_TRANSCRIPT);

    for (let turn = 0; turn < 10 && state.phase !== "debate"; turn++) {
      // Like the hook in Phase 3: consume events up to the start of the debate.
      const all = await collect(transcript);
      const debateAt = all.findIndex((e) => e.type === "phase" && e.phase === "debate");
      const events = debateAt >= 0 ? all.slice(0, debateAt + 1) : all;
      for (const e of events) if (e.type === "question") transcript.questions.push(e.question);
      state = fold(state, events);
      if (state.awaiting) {
        const text = `Answer ${turn}`;
        transcript.answers.push({ questionId: state.awaiting, text });
        state = sceneReducer(state, { type: "answer_sent", questionId: state.awaiting, text });
        expect(state.userBubble).toBe(text);
      }
    }

    expect(state.asked).toHaveLength(5);
    expect(state.history.filter((h) => h.type === "answer")).toHaveLength(5);
    expect(state.history.filter((h) => h.type === "ack")).toHaveLength(5);
    expect(state.phase).toBe("debate");
    expect(state.awaiting).toBeNull();
  });

  it("resumes a half-finished session from the saved transcript", () => {
    const transcript: Transcript = {
      ...EMPTY_TRANSCRIPT,
      questions: [
        { id: "q1", judgeId: "investor", text: "First?" },
        { id: "q2", judgeId: "local", text: "Second?" },
      ],
      answers: [{ questionId: "q1", text: "Yes." }],
    };
    const state = sceneFromTranscript(transcript);
    expect(state.phase).toBe("qa");
    expect(state.user).toBe("standing");
    expect(state.awaiting).toBe("q2");
    expect(state.speech).toMatchObject({ judgeId: "local", text: "Second?", done: true });
    expect(state.history.map((h) => h.type)).toEqual(["question", "answer", "question"]);
    expect(needsTurn(state)).toBe(false);
  });

  it("reopens the question if the server never got the answer", () => {
    const transcript: Transcript = {
      ...EMPTY_TRANSCRIPT,
      questions: [{ id: "q1", judgeId: "investor", text: "First?" }],
    };
    let state = sceneFromTranscript(transcript);
    state = sceneReducer(state, { type: "answer_sent", questionId: "q1", text: "Lost" });
    expect(state.awaiting).toBeNull();

    state = sceneReducer(state, {
      type: "event",
      event: { type: "error", code: "awaiting_answer", message: "", retryable: false },
    });
    expect(state.awaiting).toBe("q1");
    expect(state.history.at(-1)?.type).toBe("question");
    expect(state.error).toBeNull();
  });

  it("ignores stray deltas for a speech that is not current", () => {
    const state = sceneFromTranscript(EMPTY_TRANSCRIPT);
    const next = sceneReducer(state, {
      type: "event",
      event: { type: "speech_delta", speechId: "nope", delta: "x" },
    });
    expect(next).toBe(state);
  });
});

async function playToEnd(): Promise<{ state: SceneState; transcript: Transcript }> {
  let state = sceneFromTranscript(EMPTY_TRANSCRIPT);
  const transcript: Transcript = structuredClone(EMPTY_TRANSCRIPT);
  for (let turn = 0; turn < 10 && state.phase !== "done"; turn++) {
    const events = await collect(transcript);
    for (const e of events) {
      if (e.type === "question") transcript.questions.push(e.question);
      if (e.type === "debate_turn") transcript.debate.push(e.turn);
      if (e.type === "verdict") transcript.verdicts.push(e.verdict);
      if (e.type === "report") transcript.report = e.report;
    }
    state = fold(state, events);
    if (state.awaiting) {
      transcript.answers.push({ questionId: state.awaiting, text: "ok" });
      state = sceneReducer(state, { type: "answer_sent", questionId: state.awaiting, text: "ok" });
    }
  }
  return { state, transcript };
}

describe("debate and verdict", () => {
  it("plays through to the score and the end of the show", async () => {
    const { state } = await playToEnd();
    expect(state.phase).toBe("done");
    expect(state.debate.length).toBeGreaterThanOrEqual(4);
    expect(state.verdicts).toHaveLength(5);
    expect(state.score?.unit).toBe("score");
    expect(state.reportReady).toBe(true);
    expect(state.speech).toBeNull();
    for (const v of state.verdicts) expect(state.judges[v.judgeId]).toBe(v.decision);
    expect(needsTurn(state)).toBe(false);
  });

  it("knows who a debate line answers while it is still streaming", async () => {
    let state = sceneFromTranscript(EMPTY_TRANSCRIPT);
    state = sceneReducer(state, {
      type: "event",
      event: {
        type: "speech_start",
        speechId: "d2",
        judgeId: "skeptic",
        kind: "debate",
        stance: "disagrees",
        replyTo: { turnId: "d1", judgeId: "investor" },
      },
    });
    expect(state.speech).toMatchObject({
      stance: "disagrees",
      replyTo: { judgeId: "investor" },
      done: false,
    });
  });

  it("resumes a finished session as done, with verdict states", async () => {
    const { transcript } = await playToEnd();
    const state = sceneFromTranscript(transcript);
    expect(state.phase).toBe("done");
    expect(state.score).toEqual(transcript.report?.overallScore);
    expect(state.verdicts).toHaveLength(5);
    expect(needsTurn(state)).toBe(false);
  });

  it("resumes mid-debate and asks for the next turn", async () => {
    const { transcript } = await playToEnd();
    const state = sceneFromTranscript({
      ...transcript,
      debate: transcript.debate.slice(0, 2),
      verdicts: [],
      report: undefined,
    });
    expect(state.phase).toBe("debate");
    expect(needsTurn(state)).toBe(true);
  });
});

describe("replay", () => {
  it("rebuilds the whole show from the transcript", async () => {
    const { state: live, transcript } = await playToEnd();
    const replayed = replayTimeline(transcript).reduce(
      (s, { action }) => sceneReducer(s, action),
      EMPTY_SCENE,
    );
    expect(replayed.phase).toBe("done");
    expect(replayed.verdicts).toEqual(live.verdicts);
    expect(replayed.debate).toEqual(live.debate);
    expect(replayed.score).toEqual(live.score);
    expect(replayed.history.filter((h) => h.type === "answer")).toHaveLength(5);
    expect(replayed.judges).toEqual(live.judges);
  });

  it("starts with the entrance and takes a watchable amount of time", async () => {
    const { transcript } = await playToEnd();
    const timeline = replayTimeline(transcript);
    expect(timeline[0]?.action).toEqual({
      type: "event",
      event: { type: "phase", phase: "entrance" },
    });
    const totalMs = timeline.reduce((sum, t) => sum + t.delayMs, 0);
    expect(totalMs).toBeGreaterThan(20_000);
    expect(totalMs).toBeLessThan(180_000);
  });
});
