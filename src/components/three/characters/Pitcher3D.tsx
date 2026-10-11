"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useRef, useState } from "react";
import { MathUtils, type Group } from "three";
import type { UserPresence } from "@/components/boardroom/sceneState";

type Props = {
  presence: UserPresence;
  /** Where the door is (x), so the walk-in follows the reading direction. */
  doorX: number;
  /** The user just answered: a small gesture. */
  speaking: boolean;
};

export const PITCHER_SPOT: [number, number, number] = [0, 0, 3.1];

/** The pitcher, seen mostly from behind, walking in from the door. */
function PitcherView({ presence, doorX, speaking }: Props) {
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const body = useRef<Group>(null);
  // Set once: a new array on each render would make R3F snap the character back.
  const [start] = useState<[number, number, number]>(() =>
    presence === "outside" ? [doorX, 0, 5.5] : PITCHER_SPOT,
  );

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const outside = presence === "outside";
    const target = outside ? { x: doorX, z: 5.5 } : { x: PITCHER_SPOT[0], z: PITCHER_SPOT[2] };
    const speed = presence === "entering" ? 1.6 : 4;
    g.position.x = MathUtils.damp(g.position.x, target.x, speed, dt);
    g.position.z = MathUtils.damp(g.position.z, target.z, speed, dt);
    const dx = target.x - g.position.x;
    const dz = target.z - g.position.z;
    const moving = Math.hypot(dx, dz) > 0.05;
    // Face the walking direction, then turn to the panel.
    const heading = moving ? Math.atan2(dx, dz) : Math.PI;
    g.rotation.y = MathUtils.damp(g.rotation.y, heading, 6, dt);

    const t = clock.elapsedTime;
    const swing = moving ? Math.sin(t * 9) * 0.6 : 0;
    if (legL.current)
      legL.current.rotation.x = MathUtils.damp(legL.current.rotation.x, swing, 12, dt);
    if (legR.current)
      legR.current.rotation.x = MathUtils.damp(legR.current.rotation.x, -swing, 12, dt);
    if (armL.current)
      armL.current.rotation.x = MathUtils.damp(armL.current.rotation.x, -swing * 0.7, 12, dt);
    if (armR.current) {
      const gesture = speaking ? -1.1 + Math.sin(t * 5) * 0.25 : -swing * 0.7;
      armR.current.rotation.x = MathUtils.damp(armR.current.rotation.x, gesture, 8, dt);
    }
    if (body.current)
      body.current.position.y = moving
        ? Math.abs(Math.sin(t * 9)) * 0.04
        : Math.sin(t * 1.5) * 0.008;
  });

  return (
    <group ref={root} position={start} rotation={[0, Math.PI, 0]}>
      <group ref={body}>
        {[-0.13, 0.13].map((x, i) => (
          <group key={x} ref={i === 0 ? legL : legR} position={[x, 0.85, 0]}>
            <mesh position={[0, -0.42, 0]} castShadow>
              <capsuleGeometry args={[0.09, 0.62, 4, 10]} />
              <meshStandardMaterial color="#2b3450" roughness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.25, 0]} scale={[1.15, 1, 0.8]} castShadow>
          <capsuleGeometry args={[0.28, 0.45, 6, 16]} />
          <meshStandardMaterial color="#f5b642" roughness={0.55} />
        </mesh>
        {[-0.4, 0.4].map((x, i) => (
          <group key={x} ref={i === 0 ? armL : armR} position={[x, 1.5, 0]}>
            <mesh position={[0, -0.3, 0]}>
              <capsuleGeometry args={[0.075, 0.45, 4, 10]} />
              <meshStandardMaterial color="#f5b642" roughness={0.55} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.88, 0]} castShadow>
          <sphereGeometry args={[0.25, 32, 24]} />
          <meshStandardMaterial color="#d7a47c" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.93, 0.02]} scale={[1.06, 0.95, 1.08]}>
          <sphereGeometry args={[0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
          <meshStandardMaterial color="#2a1d15" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export const Pitcher3D = memo(PitcherView);
