"use client";

import { ContactShadows, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { SceneState } from "@/components/boardroom/sceneState";
import { JUDGES, type JudgeId } from "@/domain";
import { CameraDirector } from "./CameraDirector";
import { initialQuality, token, type Quality } from "./capability";
import { Judge3D } from "./characters/Judge3D";
import { Pitcher3D } from "./characters/Pitcher3D";
import { Effects } from "./Effects";
import { JUDGE_Z, Room, type Palette } from "./Room";

type Props = {
  state: SceneState;
  /** Right-to-left pages mirror the seating, like the 2D scene. */
  rtl: boolean;
};

function scoreColor(value: number): string {
  if (value < 40) return "#ef4444";
  if (value < 65) return "#f5b642";
  return "#22c55e";
}

/** The 3D boardroom. Purely visual: all text stays in the page around it. */
export default function BoardroomCanvas({ state, rtl }: Props) {
  const [quality, setQuality] = useState<Quality>(() => initialQuality());
  const high = quality === "high";
  const side: 1 | -1 = rtl ? -1 : 1;

  const palette = useMemo<Palette>(
    () => ({
      bg: token("--bg", "#0b0f19"),
      floor: token("--surface", "#131a2a"),
      wall: token("--surface-2", "#1b2336"),
      table: token("--table", "#5d4330"),
      accent: token("--accent", "#f5b642"),
    }),
    [],
  );
  const seatX = useMemo(
    () =>
      Object.fromEntries(JUDGES.map((j) => [j.id, (j.seat - 2) * 2.15 * side])) as Record<
        JudgeId,
        number
      >,
    [side],
  );
  const speaker = state.speech?.judgeId ?? null;

  return (
    <Canvas
      shadows={high}
      dpr={[1, high ? 1.75 : 1.25]}
      camera={{ fov: 40, position: [0, 4.4, 12.5], near: 0.1, far: 60 }}
      gl={{ antialias: !high, powerPreference: "high-performance" }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 14, 32]} />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#c9d8ff", palette.floor, 0.5]} />
      <directionalLight
        position={[4, 9, 7]}
        intensity={1.3}
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
      />

      <Room palette={palette} seatX={seatX} activeJudge={speaker} />
      {JUDGES.map((j) => (
        <Judge3D
          key={j.id}
          judgeId={j.id}
          state={state.judges[j.id]}
          position={[seatX[j.id], 0, JUDGE_Z]}
          speaking={speaker === j.id && !!state.speech && !state.speech.done}
        />
      ))}
      <Pitcher3D presence={state.user} doorX={-7 * side} speaking={!!state.userBubble} />

      {/* drifting dust in the light */}
      <Sparkles
        count={high ? 70 : 30}
        scale={[16, 5, 9]}
        position={[0, 2.6, 0]}
        size={2.2}
        speed={0.25}
        opacity={0.35}
        color={palette.accent}
      />
      {/* celebration when the score lands */}
      {state.score && (
        <Sparkles
          key={state.score.value}
          count={high ? 140 : 60}
          scale={[7, 3, 4]}
          position={[0, 2.2, -0.6]}
          size={7}
          speed={0.9}
          opacity={0.9}
          color={scoreColor(state.score.value)}
        />
      )}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={18}
        blur={2.2}
        far={3}
        resolution={high ? 1024 : 512}
        frames={high ? Infinity : 1}
      />
      <CameraDirector state={state} seatX={seatX} side={side} />
      {high && <Effects />}
    </Canvas>
  );
}
