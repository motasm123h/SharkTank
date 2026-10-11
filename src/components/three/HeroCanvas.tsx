"use client";

import { PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { MathUtils } from "three";
import { JUDGES, type JudgeId, type JudgeState } from "@/domain";
import { initialQuality, token, type Quality } from "./capability";
import { Judge3D } from "./characters/Judge3D";
import { Effects } from "./Effects";
import { JUDGE_Z, Room, type Palette } from "./Room";

const REACTIONS: JudgeState[] = ["happy", "thinking", "skeptical", "idle"];

/** Slow orbit around the table, always looking at the panel. */
function Orbit() {
  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime * 0.12;
    const x = Math.sin(t) * 3.6;
    const z = 7.5 + Math.cos(t * 0.8) * 1.2;
    camera.position.x = MathUtils.damp(camera.position.x, x, 1.5, dt);
    camera.position.y = MathUtils.damp(camera.position.y, 3 + Math.sin(t * 1.3) * 0.4, 1.5, dt);
    camera.position.z = MathUtils.damp(camera.position.z, z, 1.5, dt);
    camera.lookAt(0, 1.4, JUDGE_Z);
  });
  return null;
}

/** Landing-page hero: the panel in session, taking turns to talk. */
export default function HeroCanvas({ rtl }: { rtl: boolean }) {
  const [quality, setQuality] = useState<Quality>(() => initialQuality());
  const [speaker, setSpeaker] = useState<JudgeId>("investor");
  const [states, setStates] = useState<Record<JudgeId, JudgeState>>(
    () => Object.fromEntries(JUDGES.map((j) => [j.id, "idle"])) as Record<JudgeId, JudgeState>,
  );
  const side = rtl ? -1 : 1;
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

  // Every few seconds another judge talks while the others react.
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      const next = JUDGES[(i * 2) % JUDGES.length]!.id;
      setSpeaker(next);
      setStates(
        Object.fromEntries(
          JUDGES.map((j, k) => [
            j.id,
            j.id === next ? "talking" : REACTIONS[(i + k) % REACTIONS.length],
          ]),
        ) as Record<JudgeId, JudgeState>,
      );
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const high = quality === "high";
  return (
    <Canvas
      dpr={[1, high ? 1.75 : 1.25]}
      camera={{ fov: 38, position: [0, 3, 8] }}
      gl={{ antialias: !high, powerPreference: "high-performance" }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 10, 24]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#c9d8ff", palette.floor, 0.5]} />
      <directionalLight position={[4, 9, 7]} intensity={1.2} />
      <Room palette={palette} seatX={seatX} activeJudge={speaker} />
      {JUDGES.map((j) => (
        <Judge3D
          key={j.id}
          judgeId={j.id}
          state={states[j.id]}
          position={[seatX[j.id], 0, JUDGE_Z]}
          speaking={speaker === j.id}
        />
      ))}
      <Sparkles
        count={high ? 60 : 25}
        scale={[14, 5, 8]}
        position={[0, 2.6, 0]}
        size={2.4}
        speed={0.3}
        opacity={0.4}
        color={palette.accent}
      />
      <Orbit />
      {high && <Effects />}
    </Canvas>
  );
}
