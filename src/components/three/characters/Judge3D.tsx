"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import { JUDGES, type JudgeId, type JudgeState } from "@/domain";

/**
 * A judge built from simple shapes. Same contract as the SVG avatar
 * (`judgeId` + `state`), so either can be used anywhere.
 */
type Props = {
  judgeId: JudgeId;
  state: JudgeState;
  position: [number, number, number];
  /** The judge is speaking right now (mic glows, spotlight follows). */
  speaking?: boolean;
};

type Look = { skin: string; hair: string; hairStyle: "short" | "crop" | "curly" | "bun" | "grey" };

const LOOKS: Record<JudgeId, Look> = {
  investor: { skin: "#e9bd98", hair: "#2b1d14", hairStyle: "short" },
  local: { skin: "#c68a5e", hair: "#1a1a1a", hairStyle: "crop" },
  marketing: { skin: "#8d5a3b", hair: "#3b2416", hairStyle: "curly" },
  finance: { skin: "#e0ac7e", hair: "#5a3420", hairStyle: "bun" },
  skeptic: { skin: "#a8704b", hair: "#9a9a9a", hairStyle: "grey" },
};

const COLOR = Object.fromEntries(JUDGES.map((j) => [j.id, j.color])) as Record<JudgeId, string>;
const INK = "#1d1a1f";

/** Pose targets per state; the frame loop eases toward them. */
const POSE: Record<
  JudgeState,
  {
    tilt: number;
    nod: number;
    lean: number;
    brow: number;
    armL: number;
    armR: number;
    cross: number;
  }
> = {
  idle: { tilt: 0, nod: 0, lean: 0, brow: 0, armL: 0, armR: 0, cross: 0 },
  talking: { tilt: 0, nod: 0.05, lean: 0.08, brow: 0.02, armL: 0, armR: 0.25, cross: 0 },
  thinking: { tilt: 0.18, nod: -0.12, lean: -0.04, brow: 0.03, armL: 0, armR: 1.1, cross: 0 },
  happy: { tilt: 0, nod: 0.08, lean: 0.05, brow: 0.03, armL: 0, armR: 0, cross: 0 },
  skeptical: { tilt: -0.2, nod: 0.06, lean: -0.08, brow: -0.02, armL: 0, armR: 0, cross: 0.6 },
  in: { tilt: 0, nod: 0.05, lean: 0.06, brow: 0.03, armL: 0, armR: 2.4, cross: 0 },
  out: { tilt: -0.08, nod: 0.15, lean: -0.1, brow: -0.03, armL: 0, armR: 0, cross: 1 },
};

function Hair({ look }: { look: Look }) {
  const mat = <meshStandardMaterial color={look.hair} roughness={0.9} />;
  switch (look.hairStyle) {
    case "bun":
      return (
        <group>
          <mesh position={[0, 0.06, -0.02]} scale={[1.04, 0.85, 1.04]}>
            <sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.33, -0.06]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            {mat}
          </mesh>
        </group>
      );
    case "curly":
      return (
        <mesh position={[0, 0.08, -0.04]} scale={[1.2, 1.05, 1.18]}>
          <sphereGeometry args={[0.27, 9, 6, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
          <meshStandardMaterial color={look.hair} roughness={1} flatShading />
        </mesh>
      );
    default:
      return (
        <mesh
          position={[0, 0.05, -0.03]}
          scale={[1.05, look.hairStyle === "crop" ? 0.7 : 0.85, 1.06]}
        >
          <sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          {mat}
        </mesh>
      );
  }
}

function HeadAccessory({ judgeId }: { judgeId: JudgeId }) {
  const frame = <meshStandardMaterial color={INK} metalness={0.4} roughness={0.4} />;
  switch (judgeId) {
    case "marketing":
      return (
        <group>
          <mesh rotation={[0, 0, 0]} position={[0, 0.06, 0]}>
            <torusGeometry args={[0.29, 0.018, 8, 32, Math.PI]} />
            {frame}
          </mesh>
          <mesh position={[0.15, -0.14, 0.2]} rotation={[0, 0, 0.6]}>
            <capsuleGeometry args={[0.012, 0.18, 4, 8]} />
            {frame}
          </mesh>
          <mesh position={[0.08, -0.2, 0.25]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            {frame}
          </mesh>
        </group>
      );
    case "finance":
      return (
        <group position={[0, 0.02, 0.24]}>
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.06, 0.008, 8, 24]} />
              {frame}
            </mesh>
          ))}
        </group>
      );
    case "skeptic":
      return (
        <group position={[0, 0.02, 0.245]}>
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.065, 0.009, 6, 4]} />
              {frame}
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

function JudgeView({ judgeId, state, position, speaking = false }: Props) {
  const look = LOOKS[judgeId];
  const color = COLOR[judgeId];
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const mouth = useRef<Mesh>(null);
  const browL = useRef<Mesh>(null);
  const browR = useRef<Mesh>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const mic = useRef<MeshStandardMaterial>(null);
  const halo = useRef<MeshStandardMaterial>(null);
  const dots = useRef<Group>(null);
  // Desynchronise judges so they don't breathe in unison.
  const phase = useRef(JUDGES.findIndex((j) => j.id === judgeId) * 1.7);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + phase.current;
    const pose = POSE[state];
    const k = 6;
    if (torso.current) {
      torso.current.position.y =
        Math.sin(t * 1.6) * 0.012 +
        (state === "happy" || state === "in" ? Math.abs(Math.sin(t * 6)) * 0.03 : 0);
      torso.current.rotation.x = MathUtils.damp(torso.current.rotation.x, pose.lean, k, dt);
    }
    if (head.current) {
      head.current.rotation.z = MathUtils.damp(head.current.rotation.z, pose.tilt, k, dt);
      const talkingNod = state === "talking" ? Math.sin(t * 7) * 0.04 : 0;
      head.current.rotation.x = MathUtils.damp(
        head.current.rotation.x,
        pose.nod + talkingNod,
        k,
        dt,
      );
      head.current.rotation.y = MathUtils.damp(
        head.current.rotation.y,
        Math.sin(t * 0.4) * 0.08,
        2,
        dt,
      );
    }
    if (eyes.current) {
      const blink = t % 4.2 < 0.12 ? 0.1 : 1;
      eyes.current.scale.y = MathUtils.damp(eyes.current.scale.y, blink, 30, dt);
      eyes.current.position.y = MathUtils.damp(
        eyes.current.position.y,
        state === "thinking" ? 0.06 : 0.03,
        k,
        dt,
      );
    }
    if (mouth.current) {
      const open =
        state === "talking"
          ? 0.4 + Math.abs(Math.sin(t * 14)) * 1.2
          : state === "happy" || state === "in"
            ? 1.1
            : 0.35;
      mouth.current.scale.y = MathUtils.damp(mouth.current.scale.y, open, 18, dt);
      const smile = state === "out" ? -0.02 : state === "skeptical" ? 0.01 : 0;
      mouth.current.position.y = MathUtils.damp(mouth.current.position.y, -0.12 + smile, k, dt);
    }
    if (browL.current && browR.current) {
      browL.current.position.y = MathUtils.damp(browL.current.position.y, 0.12 + pose.brow, k, dt);
      const skeptic = state === "skeptical" ? 0.06 : 0;
      browR.current.position.y = MathUtils.damp(
        browR.current.position.y,
        0.12 + pose.brow + skeptic,
        k,
        dt,
      );
      browR.current.rotation.z = MathUtils.damp(
        browR.current.rotation.z,
        state === "skeptical" ? 0.35 : state === "out" ? 0.25 : 0,
        k,
        dt,
      );
      browL.current.rotation.z = MathUtils.damp(
        browL.current.rotation.z,
        state === "out" ? -0.25 : 0,
        k,
        dt,
      );
    }
    if (armR.current && armL.current) {
      armR.current.rotation.x = MathUtils.damp(armR.current.rotation.x, -pose.armR, 5, dt);
      armR.current.rotation.z = MathUtils.damp(armR.current.rotation.z, pose.cross * 0.9, 5, dt);
      armL.current.rotation.z = MathUtils.damp(armL.current.rotation.z, -pose.cross * 0.9, 5, dt);
    }
    if (mic.current) {
      mic.current.emissiveIntensity = MathUtils.damp(
        mic.current.emissiveIntensity,
        speaking ? 4 : 0.2,
        8,
        dt,
      );
    }
    if (halo.current) {
      const target = state === "in" || state === "out" ? 2.5 + Math.sin(t * 3) * 0.6 : 0;
      halo.current.emissiveIntensity = MathUtils.damp(
        halo.current.emissiveIntensity,
        target,
        4,
        dt,
      );
      halo.current.opacity = MathUtils.damp(halo.current.opacity, target > 0 ? 0.9 : 0, 4, dt);
      halo.current.emissive.set(state === "out" ? "#ef4444" : "#22c55e");
      halo.current.color.set(state === "out" ? "#ef4444" : "#22c55e");
    }
    if (dots.current) {
      dots.current.visible = state === "thinking";
      dots.current.children.forEach(
        (c, i) => (c.position.y = 0.05 + i * 0.09 + Math.sin(t * 4 + i) * 0.02),
      );
    }
  });

  return (
    <group ref={root} position={position}>
      {/* chair */}
      <mesh position={[0, 1.05, -0.42]} castShadow>
        <boxGeometry args={[0.95, 1.25, 0.1]} />
        <meshStandardMaterial color="#2a2f3d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, -0.05]}>
        <boxGeometry args={[0.9, 0.1, 0.8]} />
        <meshStandardMaterial color="#2a2f3d" roughness={0.6} />
      </mesh>

      <group ref={torso}>
        {/* body */}
        <mesh position={[0, 1.02, -0.05]} scale={[1.2, 1, 0.85]} castShadow>
          <capsuleGeometry args={[0.3, 0.42, 6, 16]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        {/* shirt */}
        <mesh position={[0, 1.24, 0.2]} rotation={[0.25, 0, Math.PI]}>
          <coneGeometry args={[0.1, 0.24, 3]} />
          <meshStandardMaterial color="#f3f5fa" roughness={0.8} />
        </mesh>
        {judgeId === "investor" && (
          <mesh position={[0, 1.08, 0.24]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.07, 0.36, 0.02]} />
            <meshStandardMaterial color="#1f2a44" />
          </mesh>
        )}
        {judgeId === "local" && (
          <mesh position={[0.2, 1.18, 0.22]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
        )}

        {/* arms (pivot at the shoulder) */}
        <group ref={armL} position={[-0.42, 1.3, 0]}>
          <mesh position={[0, -0.25, 0.12]} rotation={[0.9, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        </group>
        <group ref={armR} position={[0.42, 1.3, 0]}>
          <mesh position={[0, -0.25, 0.12]} rotation={[0.9, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.45, 0.32]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshStandardMaterial color={look.skin} roughness={0.7} />
          </mesh>
        </group>

        {/* neck + head */}
        <mesh position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.14, 12]} />
          <meshStandardMaterial color={look.skin} roughness={0.7} />
        </mesh>
        <group ref={head} position={[0, 1.68, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.27, 32, 24]} />
            <meshStandardMaterial color={look.skin} roughness={0.65} />
          </mesh>
          <Hair look={look} />
          <group ref={eyes} position={[0, 0.03, 0.235]}>
            {[-0.09, 0.09].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <sphereGeometry args={[0.03, 12, 10]} />
                <meshStandardMaterial color={INK} roughness={0.3} />
              </mesh>
            ))}
          </group>
          <mesh ref={browL} position={[-0.09, 0.12, 0.245]}>
            <boxGeometry args={[0.09, 0.018, 0.015]} />
            <meshStandardMaterial color={look.hair === "#9a9a9a" ? "#6b6b6b" : look.hair} />
          </mesh>
          <mesh ref={browR} position={[0.09, 0.12, 0.245]}>
            <boxGeometry args={[0.09, 0.018, 0.015]} />
            <meshStandardMaterial color={look.hair === "#9a9a9a" ? "#6b6b6b" : look.hair} />
          </mesh>
          <mesh ref={mouth} position={[0, -0.12, 0.245]} scale={[1, 0.35, 1]}>
            <capsuleGeometry args={[0.022, 0.07, 4, 8]} />
            <meshStandardMaterial color="#5a1f24" roughness={0.5} />
          </mesh>
          <HeadAccessory judgeId={judgeId} />
          {/* "thinking" dots */}
          <group ref={dots} position={[0.3, 0.3, 0]} visible={false}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.07, 0.05 + i * 0.09, 0]}>
                <sphereGeometry args={[0.025 + i * 0.008, 10, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* microphone on the table in front of the judge */}
      <group position={[0.18, 0.98, 0.75]} rotation={[-0.5, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
          <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <sphereGeometry args={[0.04, 12, 10]} />
          <meshStandardMaterial
            ref={mic}
            color="#333"
            emissive={color}
            emissiveIntensity={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* verdict halo on the floor */}
      <mesh position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.7, 48]} />
        <meshStandardMaterial
          ref={halo}
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export const Judge3D = memo(JudgeView);
