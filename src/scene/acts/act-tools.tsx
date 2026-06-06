import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { tools } from '../../data/portfolio-content';

// Act 2 — Tools
// 6 cubes on a circle (radius 2.2). Native meshPhysicalMaterial — no
// MeshTransmissionMaterial to avoid the expensive offscreen render pass.
// Emissive halo planes behind each cube catch bloom for a backlight strip effect.

const CIRCLE_RADIUS = 2.2;
const CUBE_SIZE = 0.78;
const CREAM = '#F1E9DA';

// Individual Y-rotation speeds per cube
const ROT_SPEEDS = [0.18, 0.13, 0.22, 0.16, 0.10, 0.20];
const ROT_OFFSETS = [0.1, 0.9, 0.4, 1.4, 0.7, 2.1];

function circlePosition(i: number, total: number): [number, number, number] {
  const angle = (i / total) * Math.PI * 2;
  return [
    Math.cos(angle) * CIRCLE_RADIUS,
    0,
    Math.sin(angle) * CIRCLE_RADIUS,
  ];
}

interface CubeProps {
  index: number;
  position: [number, number, number];
  label: string;
  reduced: boolean;
  activeRef: { readonly current: boolean };
  elapsedRef: { readonly current: number };
  highlightedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function GlassCube({
  index,
  position,
  label,
  reduced,
  activeRef,
  elapsedRef,
  highlightedRef,
  envelopeRef,
}: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!activeRef.current) return;
    const mesh = meshRef.current;
    const mat = matRef.current;
    const halo = haloRef.current;
    const haloMat = haloMatRef.current;
    if (!mesh) return;

    // Slow Y rotation
    if (!reduced) {
      mesh.rotation.y += 0.016 * ROT_SPEEDS[index];
    }

    const isHighlighted = highlightedRef.current === index;
    const elapsed = elapsedRef.current;
    const envelope = envelopeRef.current;

    // Highlighted cube scales up and emits brighter
    if (isHighlighted) {
      mesh.scale.setScalar(1.15 + 0.04 * Math.sin(elapsed * 3.5));
      if (mat) mat.emissiveIntensity = 1.2 * envelope;
    } else {
      mesh.scale.setScalar(1.0);
      if (mat) mat.emissiveIntensity = 0.25 * envelope;
    }

    // Halo behind cube brightens with highlight
    if (halo && haloMat) {
      haloMat.emissiveIntensity = (isHighlighted ? 2.0 : 0.5) * envelope;
      haloMat.opacity = (isHighlighted ? 0.55 : 0.2) * envelope;
    }
  });

  return (
    <group position={position}>
      {/* Emissive bloom halo plane behind cube, facing world center */}
      <mesh
        ref={haloRef}
        position={[0, 0, 0.06]}
        rotation={[0, 0, 0]}
      >
        <planeGeometry args={[CUBE_SIZE * 1.55, CUBE_SIZE * 1.55]} />
        <meshStandardMaterial
          ref={haloMatRef}
          color="#F40009"
          emissive="#F40009"
          emissiveIntensity={0.5}
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glass cube — native physical material, no offscreen pass */}
      <mesh ref={meshRef} rotation={[0, ROT_OFFSETS[index], 0]} castShadow={false}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshPhysicalMaterial
          ref={matRef}
          transmission={0.85}
          roughness={0.25}
          ior={1.4}
          thickness={0.4}
          color="#F40009"
          attenuationColor="#F40009"
          attenuationDistance={2.5}
          emissive="#F40009"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Tool label — cream with dark outline for legibility */}
      <Text
        position={[0, CUBE_SIZE * 0.72, 0]}
        fontSize={0.2}
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

  const positions = useMemo<[number, number, number][]>(
    () => tools.map((_, i) => circlePosition(i, tools.length)),
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
    // Drive index 0..5 across the act window
    highlightedRef.current = Math.min(tools.length - 1, Math.floor(localT * tools.length));

    // Slowly rotate the whole ring
    if (!reduced) {
      group.rotation.y += 0.0012;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight position={[0, 3, 0]} intensity={2.2} color={CREAM} />
      <pointLight position={[0, -2, 0]} intensity={1.0} color="#A06A00" />
      <pointLight position={[0, 0, 3]} intensity={1.4} color="#F40009" />

      {tools.map((tool, i) => (
        <GlassCube
          key={tool.id}
          index={i}
          position={positions[i]}
          label={tool.name}
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
