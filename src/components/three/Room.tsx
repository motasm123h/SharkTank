"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import { Color, MathUtils, type PointLight } from "three";
import { JUDGES, type JudgeId } from "@/domain";

export type Palette = { bg: string; floor: string; wall: string; table: string; accent: string };

type Props = {
  palette: Palette;
  seatX: Record<JudgeId, number>;
  activeJudge: JudgeId | null;
};

const JUDGE_Z = -1.55;

/** Floor, back wall with glowing strips and the panel emblem, the long table and lights. */
function RoomView({ palette, seatX, activeJudge }: Props) {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={palette.floor} roughness={0.85} />
      </mesh>
      {/* back wall + panels */}
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>
      {[-7.5, -2.5, 2.5, 7.5].map((x) => (
        <mesh key={x} position={[x, 3.2, -3.98]}>
          <planeGeometry args={[4.4, 4.2]} />
          <meshStandardMaterial color={palette.wall} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {/* light strips (bloom picks these up) */}
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 3.4, -3.95]}>
          <boxGeometry args={[0.06, 4.6, 0.02]} />
          <meshStandardMaterial
            color={palette.accent}
            emissive={palette.accent}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* emblem: five seats, one per judge color */}
      <group position={[0, 4.4, -3.94]}>
        <mesh>
          <circleGeometry args={[0.95, 48]} />
          <meshStandardMaterial color="#111727" roughness={0.6} />
        </mesh>
        {JUDGES.map((j, i) => (
          <mesh key={j.id} position={[(i - 2) * 0.32, 0.18, 0.01]}>
            <circleGeometry args={[0.11, 24]} />
            <meshStandardMaterial
              color={j.color}
              emissive={j.color}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
        ))}
        <mesh position={[0, -0.22, 0.01]}>
          <planeGeometry args={[1.2, 0.2]} />
          <meshStandardMaterial
            color={palette.accent}
            emissive={palette.accent}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* the table */}
      <RoundedBox
        args={[11.5, 0.12, 1.5]}
        radius={0.05}
        position={[0, 0.92, -0.8]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.table} roughness={0.35} metalness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0.48, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[11.3, 0.86, 0.08]} />
        <meshStandardMaterial color={palette.table} roughness={0.5} />
      </mesh>

      {JUDGES.map((j) => (
        <SeatLight key={j.id} x={seatX[j.id]} color={j.color} active={activeJudge === j.id} />
      ))}
    </group>
  );
}

/** A light above each seat; brightens and takes the judge's color when they speak. */
function SeatLight({ x, color, active }: { x: number; color: string; active: boolean }) {
  const light = useRef<PointLight>(null);
  const warm = useRef(new Color("#ffd9a8"));
  const tint = useRef(new Color(color));
  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    l.intensity = MathUtils.damp(l.intensity, active ? 14 : 4, 5, dt);
    l.color.lerpColors(warm.current, tint.current, active ? 0.6 : 0.1);
  });
  return (
    <pointLight
      ref={light}
      position={[x, 3.1, JUDGE_Z + 0.9]}
      distance={6}
      decay={2}
      intensity={4}
    />
  );
}

export const Room = memo(RoomView);
export { JUDGE_Z };
