import { describe, expect, it } from "vitest";
import { EMPTY_SCENE, type SceneState } from "@/components/boardroom/sceneState";
import { JUDGES, type JudgeId } from "@/domain";
import { chooseShot } from "./CameraDirector";

const seatX = Object.fromEntries(JUDGES.map((j) => [j.id, (j.seat - 2) * 2.15])) as Record<
  JudgeId,
  number
>;
const scene = (patch: Partial<SceneState>): SceneState => ({ ...EMPTY_SCENE, ...patch });
const speech = (judgeId: JudgeId, kind: "question" | "debate" | "verdict", extra = {}) => ({
  id: "s",
  judgeId,
  kind,
  text: "",
  done: false,
  ...extra,
});

describe("chooseShot", () => {
  it("opens wide while the panel takes its seats", () => {
    const shot = chooseShot(scene({ phase: "loading" }), seatX, 1);
    expect(shot.pos[2]).toBeGreaterThan(10);
  });

  it("frames whoever asks a question, close up", () => {
    const shot = chooseShot(
      scene({ phase: "qa", user: "standing", speech: speech("finance", "question") }),
      seatX,
      1,
    );
    expect(shot.look[0]).toBe(seatX.finance);
    expect(shot.pos[2]).toBeLessThan(2);
  });

  it("goes over the shoulder while the user answers", () => {
    const shot = chooseShot(scene({ phase: "qa", user: "standing", awaiting: "q1" }), seatX, 1);
    expect(shot.look[0]).toBe(0);
    expect(shot.pos[2]).toBeGreaterThan(5);
  });

  it("uses a two-shot between a debater and the judge they answer", () => {
    const shot = chooseShot(
      scene({
        phase: "debate",
        user: "standing",
        speech: speech("skeptic", "debate", {
          stance: "disagrees",
          replyTo: { turnId: "d1", judgeId: "investor" },
        }),
      }),
      seatX,
      1,
    );
    expect(shot.look[0]).toBeCloseTo((seatX.skeptic + seatX.investor) / 2);
    // Farther judges → camera pulls back to fit both.
    expect(shot.pos[2]).toBeGreaterThan(3);
  });

  it("pushes in low on each verdict", () => {
    const shot = chooseShot(
      scene({ phase: "verdict", user: "standing", speech: speech("local", "verdict") }),
      seatX,
      1,
    );
    expect(shot.look[0]).toBe(seatX.local);
    expect(shot.pos[1]).toBeLessThan(1.7);
    expect(shot.pos[2]).toBeLessThan(1);
  });

  it("pulls back and orbits for the score, mirrored for right-to-left", () => {
    const score = { value: 64, unit: "score" as const, isEstimate: true };
    const ltr = chooseShot(scene({ phase: "done", user: "standing", score }), seatX, 1);
    const rtl = chooseShot(scene({ phase: "done", user: "standing", score }), seatX, -1);
    expect(ltr.orbit).toBeGreaterThan(0.5);
    expect(rtl.pos[0]).toBe(-ltr.pos[0]);
  });
});
