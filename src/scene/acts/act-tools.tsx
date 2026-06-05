import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { tools } from '../../data/portfolio-content';

// S-curve: 6 cubes from (-3.5, 0.4, -1) → (3.5, -0.4, 1)
// A sine bow in Y makes the path read as a gentle S rather than a diagonal.
function sCurvePosition(i: number): [number, number, number] {
  const t = i / 5;
  const x = THREE.MathUtils.lerp(-3.5, 3.5, t);
  const y = 0.4 - 0.8 * t + 0.25 * Math.sin(t * Math.PI);
  const z = THREE.MathUtils.lerp(-1, 1, t);
  return [x, y, z];
}

// Per-cube independent rotation speeds and base offsets
const ROT_SPEEDS: [number, number, number][] = [
  [0.22, 0.14, 0.08],
  [0.18, 0.26, 0.11],
  [0.12, 0.19, 0.20],
  [0.25, 0.10, 0.16],
  [0.09, 0.23, 0.13],
  [0.16, 0.12, 0.25],
];

const ROT_OFFSETS: [number, number, number][] = [
  [0.1, 0.3, 0.0],
  [0.5, 0.0, 0.2],
  [0.0, 0.7, 0.4],
  [0.2, 0.1, 0.6],
  [0.8, 0.4, 0.1],
  [0.3, 0.6, 0.3],
];

// ─── Per-cube component ────────────────────────────────────────────────────

interface CubeProps {
  index: number;
  position: [number, number, number];
  label: string;
  reduced: boolean;
  activeRef: React.RefObject<boolean>;
  envelopeRef: React.RefObject<number>;
  highlightedRef: React.RefObject<number>;
  elapsedRef: React.RefObject<number>;
}

function GlassCube({
  index,
  position,
  label,
  reduced,
  activeRef,
  envelopeRef,
  highlightedRef,
  elapsedRef,
}: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = ROT_SPEEDS[index];
  const rotBase = ROT_OFFSETS[index];

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || !activeRef.current) return;

    // Individual idle rotation
    if (!reduced) {
      mesh.rotation.x += dt * speed[0];
      mesh.rotation.y += dt * speed[1];
      mesh.rotation.z += dt * speed[2];
    }

    // Pulse scale for the highlighted (closest-to-camera) cube
    const highlighted = highlightedRef.current === index;
    if (highlighted) {
      const elapsed = elapsedRef.current ?? 0;
      mesh.scale.setScalar(1.05 + 0.03 * Math.sin(elapsed * 3.5));
    } else {
      mesh.scale.setScalar(1.0);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} rotation={[rotBase[0], rotBase[1], rotBase[2]]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <MeshTransmissionMaterial
          thickness={0.5}
          roughness={0.15}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.04}
          backside={true}
        />
      </mesh>

      {/* Tool name — slightly in front of the +Z face, always faces camera */}
      <Text
        position={[0, 0, 0.38]}
        fontSize={0.18}
        color="#F1E9DA"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ─── Act root ──────────────────────────────────────────────────────────────

export function ActTools() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  // Refs shared downward so GlassCube children can read per-frame state
  // without triggering React re-renders.
  const activeRef = useRef<boolean>(false);
  const envelopeRef = useRef<number>(0);
  const highlightedRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const positions = useMemo<[number, number, number][]>(
    () => tools.map((_, i) => sCurvePosition(i)),
    [],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('tools', globalT);

    group.visible = active;
    activeRef.current = active;

    if (!active) return;

    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = actEnvelope(localT);
    // Which cube is "current": 0–5 mapped across the act window
    highlightedRef.current = Math.min(5, Math.floor(localT * 6));
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Warm fill + caramel rim to catch the glass facets */}
      <pointLight position={[0, 2, 3]} intensity={1.8} color="#F1E9DA" />
      <pointLight position={[-4, -1, -2]} intensity={0.8} color="#A06A00" />

      {tools.map((tool, i) => (
        <GlassCube
          key={tool.id}
          index={i}
          position={positions[i]}
          label={tool.name}
          reduced={reduced}
          activeRef={activeRef}
          envelopeRef={envelopeRef}
          highlightedRef={highlightedRef}
          elapsedRef={elapsedRef}
        />
      ))}
    </group>
  );
}
