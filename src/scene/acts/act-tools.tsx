import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { tools } from '../../data/portfolio-content';
import { CokeBottle } from '../brand/coke-bottle';

// Act 2 — Tools
// 6 mini Coca-Cola contour bottles on a ring (radius 2.4).
// Each bottle carries the tool name on its label band via customLabel prop.
// meshStandardMaterial / clearcoat only — zero transmission passes.

const CIRCLE_RADIUS = 2.4;
const BOTTLE_SCALE = 0.55;
const COKE_RED = '#F40009';
const CREAM = '#F1E9DA';

function circlePosition(i: number, total: number): [number, number, number] {
  const angle = (i / total) * Math.PI * 2;
  return [Math.cos(angle) * CIRCLE_RADIUS, 0, Math.sin(angle) * CIRCLE_RADIUS];
}

function circleAngle(i: number, total: number): number {
  return (i / total) * Math.PI * 2;
}

interface ToolBottleProps {
  index: number;
  position: [number, number, number];
  /** Radial angle of this bottle around Y; used to orient label face outward */
  angle: number;
  label: string;
  reduced: boolean;
  activeRef: { readonly current: boolean };
  elapsedRef: { readonly current: number };
  highlightedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function ToolBottle({
  index,
  position,
  angle,
  label,
  reduced,
  activeRef,
  elapsedRef,
  highlightedRef,
  envelopeRef,
}: ToolBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef<boolean>(false);
  // highlight as state so CokeBottle.hRef stays in sync (updated only on meaningful change)
  const [highlight, setHighlight] = useState(0);
  const highlightValRef = useRef(0);

  // Radial outward direction for the hover lift in the XZ plane
  const radialDir = useMemo(
    () => new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
    [angle],
  );
  // Store base position for lerping back
  const basePos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, dt) => {
    if (!activeRef.current) {
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }
    const group = groupRef.current;
    if (!group) return;

    const isHighlighted = highlightedRef.current === index;
    const envelope = envelopeRef.current;
    const hovered = hoveredRef.current;

    // Scale pulse: highlighted or hovered = gentle swell; otherwise rest
    if (isHighlighted || hovered) {
      const pulse = reduced ? 1.1 : 1.1 + 0.04 * Math.sin(elapsedRef.current * 3.5);
      group.scale.setScalar(pulse);
    } else {
      group.scale.setScalar(1.0);
    }

    // Lerp highlight float and commit to React state only when it changes appreciably.
    // This drives CokeBottle's internal emissive lerp without per-frame re-renders.
    const targetHighlight = hovered ? 0.9 * envelope : isHighlighted ? 0.6 * envelope : 0;
    highlightValRef.current += (targetHighlight - highlightValRef.current) * Math.min(1, dt * 8);
    const snapped = Math.round(highlightValRef.current * 100) / 100;
    if (Math.abs(snapped - highlight) > 0.01) {
      setHighlight(snapped);
    }

    // Radial hover lift — move slightly outward along the ring radius, not world Z
    const liftAmount = hovered ? 0.2 : 0;
    const target = basePos.clone().addScaledVector(radialDir, liftAmount);
    group.position.lerp(target, 0.12);
  });

  // Orient bottle so its label face (+Z local) points radially outward: Y = π/2 − angle
  const facingY = Math.PI / 2 - angle;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, facingY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        hoveredRef.current = true;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }}
    >
      <CokeBottle
        scale={BOTTLE_SCALE}
        customLabel={label}
        showLogo={false}
        highlight={highlight}
      />
    </group>
  );
}

export function ActTools() {
  const groupRef = useRef<THREE.Group>(null);
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  const activeRef = useRef<boolean>(false);
  const elapsedRef = useRef<number>(0);
  const highlightedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(0);

  const bottleData = useMemo(
    () =>
      tools.map((tool, i) => ({
        position: circlePosition(i, tools.length) as [number, number, number],
        angle: circleAngle(i, tools.length),
        id: tool.id,
        name: tool.name,
      })),
    [],
  );

  useFrame(({ clock }, dt) => {
    const group = groupRef.current;
    if (!group) return;

    const envelope = mixesRef.current.tools;
    const active = envelope > 0.002;

    group.visible = active;
    activeRef.current = active;

    if (!active) return;

    group.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    // Nudge ring right so bottles don't overlap the left chapter-copy scrim
    group.position.x = 0.6;
    group.scale.setScalar(0.6 + 0.4 * envelope);

    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;
    // Cycle highlighted bottle every ~1.4 s so tools light up in sequence while focused
    highlightedRef.current = Math.floor(elapsedRef.current / 1.4) % tools.length;

    // Slowly rotate the whole ring; frame-rate-independent
    if (!reduced) {
      group.rotation.y += dt * 0.072; // ≈ 0.0012 × 60 fps
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Lighting flatters the glass bottles: cream top fill, caramel rim, red back */}
      <pointLight position={[0, 3, 0]} intensity={2.2} color={CREAM} />
      <pointLight position={[0, -2, 0]} intensity={1.0} color="#A06A00" />
      <pointLight position={[0, 0, 3]} intensity={1.4} color={COKE_RED} />

      {bottleData.map((bottle, i) => (
        <ToolBottle
          key={bottle.id}
          index={i}
          position={bottle.position}
          angle={bottle.angle}
          label={bottle.name}
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
