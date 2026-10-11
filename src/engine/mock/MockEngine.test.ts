import { describe, expect, it } from "vitest";
import { CompletedSessionSchema, EMPTY_TRANSCRIPT, JUDGE_IDS, type PitchInput } from "@/domain";
import { localize } from "./localize";
import { INSTANT_PACING, MockEngine } from "./MockEngine";
import { MOCK_SCENARIOS } from "./scenarios";
import { playThrough } from "./testing";

const engine = new MockEngine(INSTANT_PACING);

function sampleInput(scenarioId: string, language: PitchInput["language"]): PitchInput {
  const scenario = MOCK_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(scenarioId);
  return { ...localize<Omit<PitchInput, "language">>(scenario.input, language), language };
}

describe.each(MOCK_SCENARIOS.map((s) => s.id))("MockEngine plays %s", (scenarioId) => {
  it.each(["en", "ar"] as const)("end to end in %s", async (language) => {
    const input = sampleInput(scenarioId, language);
    const { events, transcript } = await playThrough(engine, input);

    expect(CompletedSessionSchema.safeParse({ input, transcript }).error).toBeUndefined();

    const phases = events.flatMap((e) => (e.type === "phase" ? [e.phase] : []));
    expect(phases).toEqual(["entrance", "qa", "debate", "verdict", "report", "done"]);

    // Streamed words add up to the structured text.
    for (const question of transcript.questions) {
      const streamed = events
        .flatMap((e) => (e.type === "speech_delta" && e.speechId === question.id ? [e.delta] : []))
        .join("");
      expect(streamed.trim()).toBe(question.text);
    }

    // Every judge ends on its verdict state.
    const lastState = new Map(
      events.flatMap((e) => (e.type === "judge_state" ? [[e.judgeId, e.state] as const] : [])),
    );
    for (const verdict of transcript.verdicts) {
      expect(lastState.get(verdict.judgeId)).toBe(verdict.decision);
    }
  });
});

it("gives the weak idea mostly 'I'm out' and a low score", async () => {
  const { transcript } = await playThrough(engine, sampleInput("cairo-water-app", "en"));
  const outs = transcript.verdicts.filter((v) => v.decision === "out").length;
  expect(outs).toBeGreaterThanOrEqual(4);
  expect(transcript.report?.overallScore.value).toBeLessThan(40);
  expect(transcript.report?.canSell.verdict).toBe("no");
});

it("gives the strong ideas a majority of 'I'm in'", async () => {
  for (const id of ["damascus-healthy-food", "mumbai-tutoring"]) {
    const { transcript } = await playThrough(engine, sampleInput(id, "en"));
    const ins = transcript.verdicts.filter((v) => v.decision === "in").length;
    expect(ins).toBeGreaterThanOrEqual(3);
  }
});

it("asks one question per judge, then stops for an answer", async () => {
  const input = sampleInput("mumbai-tutoring", "en");
  const events = [];
  for await (const e of engine.run({ input, transcript: EMPTY_TRANSCRIPT })) events.push(e);
  expect(events.at(-1)).toEqual({ type: "await_answer", questionId: "q1" });

  const { transcript } = await playThrough(engine, input);
  expect(transcript.questions.map((q) => q.judgeId).sort()).toEqual([...JUDGE_IDS].sort());
});

it("refuses to continue while a question is unanswered", async () => {
  const input = sampleInput("damascus-healthy-food", "en");
  const transcript = {
    ...EMPTY_TRANSCRIPT,
    questions: [{ id: "q1", judgeId: "investor" as const, text: "?" }],
  };
  const events = [];
  for await (const e of engine.run({ input, transcript })) events.push(e);
  expect(events).toEqual([expect.objectContaining({ type: "error", code: "awaiting_answer" })]);
});

it("picks the scenario by country when none is pinned", async () => {
  const input = { ...sampleInput("damascus-healthy-food", "en"), country: "IN" };
  const { transcript } = await playThrough(engine, input);
  expect(transcript.report?.salesPlan?.price.currency).toBe("INR");
});

it("stops streaming when aborted", async () => {
  const slow = new MockEngine({ wordMs: 20, beatMs: 20 });
  const controller = new AbortController();
  const input = sampleInput("damascus-healthy-food", "en");
  const run = async () => {
    for await (const e of slow.run(
      { input, transcript: EMPTY_TRANSCRIPT },
      { signal: controller.signal },
    )) {
      if (e.type === "speech_delta") controller.abort(new Error("aborted"));
    }
  };
  await expect(run()).rejects.toThrow("aborted");
});
