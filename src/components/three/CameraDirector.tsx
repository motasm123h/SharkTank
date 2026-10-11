"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3 } from "three";
import type { SceneState } from "@/components/boardroom/sceneState";
import type { JudgeId } from "@/domain";
import { JUDGE_Z } from "./Room";

type Shot = {
  pos: [number, number, number];
  look: [number, number, number];
  orbit: number;
  lambda: number;
};

const HEAD_Y = 1.68;

/**
 * Picks a camera shot from what is happening in the scene. Pure, so the
 * choice of shots can be reasoned about (and tested) without WebGL.
 */
export function chooseShot(state: SceneState, seatX: Record<JudgeId, number>, side: 1 | -1): Shot {
  const { phase, speech, awaiting, user, score } = state;

  if (score && (phase === "report" || phase === "done" || !speech)) {
    // Wide, high and slowly orbiting for the score reveal.
    return { pos: [2.8 * side, 4, 9.5], look: [0, 1.4, -1], orbit: 1.2, lambda: 1.2 };
  }
  if (phase === "loading" || user === "outside") {
    return { pos: [0, 4.4, 12.5], look: [0, 1.5, -1], orbit: 0.6, lambda: 1.5 };
  }
  if (phase === "entrance" || user === "entering") {
    // Dolly in behind the pitcher as they walk to their spot.
    return { pos: [2.4 * side, 3.1, 9], look: [0, 1.4, 0], orbit: 0, lambda: 1.1 };
  }
  if (awaiting) {
    // Over the shoulder: the user's turn to answer, the whole panel in view.
    return { pos: [1.9 * side, 2.7, 6.2], look: [0, 1.45, -1.4], orbit: 0, lambda: 1.6 };
  }
  if (speech) {
    const sx = seatX[speech.judgeId];
    if (speech.kind === "verdict") {
      // Low-angle push-in: the moment of decision.
      return {
        pos: [sx * 0.9, 1.55, 0.75],
        look: [sx, HEAD_Y - 0.15, JUDGE_Z],
        orbit: 0.08,
        lambda: 1.4,
      };
    }
    if (speech.kind === "debate" && speech.replyTo) {
      // Two-shot: speaker and the judge they answer.
      const tx = seatX[speech.replyTo.judgeId];
      const mid = (sx + tx) / 2;
      const spread = Math.abs(sx - tx);
      return {
        pos: [mid * 0.8, 2.2, 2.4 + spread * 0.38],
        look: [mid, HEAD_Y - 0.3, JUDGE_Z],
        orbit: 0.35,
        lambda: 1.3,
      };
    }
    // Close-up on whoever is talking.
    return {
      pos: [sx * 0.75, 1.95, 1.4],
      look: [sx, HEAD_Y - 0.28, JUDGE_Z],
      orbit: 0.12,
      lambda: 1.8,
    };
  }
  if (phase === "debate") return { pos: [0, 3, 7], look: [0, 1.4, -1.2], orbit: 0.8, lambda: 1.4 };
  if (phase === "verdict")
    return { pos: [0, 2.6, 6], look: [0, 1.5, -1.2], orbit: 0.5, lambda: 1.4 };
  return { pos: [0, 2.5, 6.2], look: [0, 1.45, -1.2], orbit: 0.3, lambda: 1.5 };
}

type Props = { state: SceneState; seatX: Record<JudgeId, number>; side: 1 | -1 };

/** Eases the camera toward the current shot; pulls back on tall, narrow screens. */
export function CameraDirector({ state, seatX, side }: Props) {
  const { camera, size } = useThree();
  const look = useRef(new Vector3(0, 1.5, -1));
  const want = useRef(new Vector3());
  const wantLook = useRef(new Vector3());

  useFrame(({ clock }, dt) => {
    const shot = chooseShot(state, seatX, side);
    const aspect = size.width / Math.max(size.height, 1);
    const pullBack = MathUtils.clamp(1.45 / aspect, 1, 2.1);

    wantLook.current.set(...shot.look);
    want.current
      .set(...shot.pos)
      .sub(wantLook.current)
      .multiplyScalar(pullBack)
      .add(wantLook.current);
    want.current.x += Math.sin(clock.elapsedTime * 0.22) * shot.orbit;

    camera.position.x = MathUtils.damp(camera.position.x, want.current.x, shot.lambda, dt);
    camera.position.y = MathUtils.damp(camera.position.y, want.current.y, shot.lambda, dt);
    camera.position.z = MathUtils.damp(camera.position.z, want.current.z, shot.lambda, dt);
    look.current.x = MathUtils.damp(look.current.x, wantLook.current.x, shot.lambda * 1.3, dt);
    look.current.y = MathUtils.damp(look.current.y, wantLook.current.y, shot.lambda * 1.3, dt);
    look.current.z = MathUtils.damp(look.current.z, wantLook.current.z, shot.lambda * 1.3, dt);
    camera.lookAt(look.current);
  });

  return null;
}
