import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, RoundedBox } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { tools } from '../../data/portfolio-content';

// Act 2 — Tools
// 6 glossy Coca-Cola red "can-label" chips on a ring (radius 2.4).
// meshStandardMaterial only — zero transmission passes.

const CIRCLE_RADIUS = 2.4;
const COKE_RED = '#F40009';
const CREAM = '#F1E9DA';

function circlePosition(i: number, total: number): [number, number, number] {
  const angle = (i / total) * Math.PI * 2;
  return [Math.cos(angle) * CIRCLE_RADIUS, 0, Math.sin(angle) * CIRCLE_RADIUS];
}

function circleAngle(i: number, total: number): number {
  return (i / total) * Math.PI * 2;
}

interface ChipProps {
  index: number;
  position: [number, number, number];
  /** Radial angle of this chip around Y; used to orient it outward */
  angle: number;
  label: string;
  reduced: boolean;
  activeRef: { readonly current: boolean };
  elapsedRef: { readonly current: number };
  highlightedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function CanLabelChip({
  index,
  position,
  angle,
  label,
  reduced,
  activeRef,
  elapsedRef,
  highlightedRef,
  envelopeRef,
}: ChipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!activeRef.current) return;
    const group = groupRef.current;
    const mat = matRef.current;
    if (!group) return;

    const isHighlighted = highlightedRef.current === index;
    const elapsed = elapsedRef.current;
    const envelope = envelopeRef.current;

    if (isHighlighted) {
      // Static scale under reduced motion; gentle pulse otherwise.
      group.scale.setScalar(reduced ? 1.12 : 1.12 + 0.05 * Math.sin(elapsed * 3.5));
      if (mat) mat.emissiveIntensity = 0.55 * envelope;
    } else {
      group.scale.setScalar(1.0);
      if (mat) mat.emissiveIntensity = 0.12 * envelope;
    }
  });

  // Rotate so the chip front (+Z local) points radially outward: Y = π/2 − angle
  const facingY = Math.PI / 2 - angle;

  return (
    <group ref={groupRef} position={position} rotation={[0, facingY, 0]}>
      {/* Can-label proportioned chip — Coca-Cola red, glossy, no transmission */}
      <RoundedBox args={[1.5, 0.95, 0.12]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          ref={matRef}
          color={COKE_RED}
          roughness={0.3}
          metalness={0.15}
          emissive={COKE_RED}
          emissiveIntensity={0.12}
        />
      </RoundedBox>

      {/* Tool name on the front face — cream with dark outline */}
      <Text
        position={[0, 0, 0.07]}
        fontSize={0.22}
        color={CREAM}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#0A0203"
      >
        {label}
      </Text>
    </group>
  );
}

export function ActTools() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  const activeRef = useRef<boolean>(false);
  const elapsedRef = useRef<number>(0);
  const highlightedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(0);

  const chipData = useMemo(
    () =>
      tools.map((tool, i) => ({
        position: circlePosition(i, tools.length) as [number, number, number],
        angle: circleAngle(i, tools.length),
        id: tool.id,
        name: tool.name,
      })),
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
    // Advance highlighted index 0..5 across the act window
    highlightedRef.current = Math.min(tools.length - 1, Math.floor(localT * tools.length));

    // Slowly rotate the whole ring; freeze when reduced motion
    if (!reduced) {
      group.rotation.y += 0.0012;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight position={[0, 3, 0]} intensity={2.2} color={CREAM} />
      <pointLight position={[0, -2, 0]} intensity={1.0} color="#A06A00" />
      <pointLight position={[0, 0, 3]} intensity={1.4} color={COKE_RED} />

      {chipData.map((chip, i) => (
        <CanLabelChip
          key={chip.id}
          index={i}
          position={chip.position}
          angle={chip.angle}
          label={chip.name}
          reduced={reduced}
          activeRef={activeRef}
          elapsedRef={elapsedRef}
          highlightedRef={highlightedRef}
          envelopeRef={envelopeRef}
        />
      ))}
    </group>
  );
}
