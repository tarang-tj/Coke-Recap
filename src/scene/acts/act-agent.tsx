import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { agent } from '../../data/portfolio-content';

// Act 3 — Agent (centerpiece)
// Clean brand-red glowing icosahedron core + 3 orbital rings + 8 data dots.
// No ribbons, no shader passes — meshStandardMaterial only.

const CREAM = '#F1E9DA';
const CARAMEL = '#A06A00';
const COKE_RED = '#E8000B';

// ─── 3 orbital ring configs ────────────────────────────────────────────────────
const RING_CONFIGS = [
  { torusR: 1.20, rotation: new THREE.Euler(Math.PI * 0.25, 0,              Math.PI * 0.10), color: CREAM,   dir:  1, pillarIdx: 0 },
  { torusR: 1.55, rotation: new THREE.Euler(Math.PI * 0.50, Math.PI * 0.35, 0             ), color: CARAMEL, dir: -1, pillarIdx: 1 },
  { torusR: 1.90, rotation: new THREE.Euler(Math.PI * 0.20, Math.PI * 0.70, Math.PI * 0.40), color: CREAM,  dir:  1, pillarIdx: 2 },
] as const;

const RING_TUBE = 0.012;
const RING_SEGS = 80;
const RING_TSEG = 8;

// Pillar labels: ['Ingest', 'Analyze', 'Surface']
const PILLAR_LABELS = agent.pillars.map((p) => p.name);

interface OrbitalRingProps {
  torusR: number;
  rotation: THREE.Euler;
  color: string;
  dir: number;
  labelText: string;
  matRef: RefObject<THREE.MeshStandardMaterial | null>;
  reduced: boolean;
  elapsedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
  peakRef: { readonly current: number };
}

function OrbitalRing({
  torusR,
  rotation,
  color,
  dir,
  labelText,
  matRef,
  reduced,
  elapsedRef,
  envelopeRef,
  peakRef,
}: OrbitalRingProps) {
  const groupRef = useRef<THREE.Group>(null);

  const labelPos = useMemo<[number, number, number]>(() => {
    const v = new THREE.Vector3(torusR + 0.28, 0, 0);
    v.applyEuler(rotation);
    return [v.x, v.y, v.z];
  }, [torusR, rotation]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    const m = matRef.current;
    if (!g || !m) return;
    // Skip all work when the agent view is faded out (avoids per-frame cost on other views).
    if (envelopeRef.current <= 0.003) return;

    if (!reduced) g.rotation.z += dt * 0.35 * dir;

    const envelope = envelopeRef.current;
    const peak = peakRef.current;
    // Static base brightness under reduced motion (no flicker).
    const basePulse = reduced ? 0.6 : 0.6 + 0.4 * Math.sin(elapsedRef.current * 1.2);
    m.emissiveIntensity = (basePulse * 0.6 + peak * 2.0) * envelope;
    m.opacity = 0.4 + 0.55 * envelope;
  });

  return (
    <>
      <group ref={groupRef} rotation={rotation}>
        <mesh>
          <torusGeometry args={[torusR, RING_TUBE, RING_TSEG, RING_SEGS]} />
          <meshStandardMaterial
            ref={matRef}
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      <Billboard position={labelPos} follow>
        <Text
          color={CREAM}
          fontSize={0.13}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#0A0203"
        >
          {labelText}
        </Text>
      </Billboard>
    </>
  );
}

// ─── 8 spiraling data dots (trimmed from 16) ──────────────────────────────────
const DOT_COUNT = 8;

const DOT_SEEDS = Array.from({ length: DOT_COUNT }, (_, i) => ({
  angleOffset: (i / DOT_COUNT) * Math.PI * 6,
  radiusBase: 1.8 + (i % 5) * 0.18,
  speed: 0.12 + (i % 4) * 0.06,
  phase: (i / DOT_COUNT) * Math.PI * 2,
}));

interface DataDotProps {
  seed: typeof DOT_SEEDS[number];
  reduced: boolean;
  elapsedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function DataDot({ seed, reduced, elapsedRef, envelopeRef }: DataDotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    if (envelopeRef.current <= 0.003) return; // skip when agent view is faded out

    const elapsed = reduced ? seed.phase * 10 : elapsedRef.current;
    const envelope = envelopeRef.current;

    // Inward spiral: radius decreases over time and recycles
    const cycle = ((elapsed * seed.speed + seed.phase) % seed.radiusBase);
    const r = seed.radiusBase - cycle;
    const angle = seed.angleOffset + elapsed * 0.4;

    mesh.position.set(
      Math.cos(angle) * r,
      Math.sin(angle * 0.7) * r * 0.35,
      Math.sin(angle) * r,
    );

    mat.opacity = Math.max(0, (r / seed.radiusBase)) * 0.85 * envelope;
    mat.emissiveIntensity = 1.6 * envelope;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.028, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={CREAM}
        emissive={CREAM}
        emissiveIntensity={1.6}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── main act ─────────────────────────────────────────────────────────────────

export function ActAgent() {
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const elapsedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(1);
  const peakRef = useRef<number>(0);

  const ringMatRefs = useMemo<RefObject<THREE.MeshStandardMaterial | null>[]>(
    () => RING_CONFIGS.map(() => ({ current: null })),
    [],
  );

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const envelope = mixesRef.current.agent;
    const active = envelope > 0.002;

    g.visible = active;
    if (!active) return;

    g.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    // Envelope doubles as the ignition peak (bright as view focuses)
    const peak = envelope;

    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;
    peakRef.current = peak;

    // Core emissive pulses with envelope
    const core = coreMatRef.current;
    if (core) {
      const targetIntensity = reduced
        ? 1.5 * envelope
        : (1.5 + 0.4 * Math.sin(clock.elapsedTime * 1.8)) * envelope;
      core.emissiveIntensity += (targetIntensity - core.emissiveIntensity) * Math.min(1, dt * 5);
    }

    if (!reduced) g.rotation.y += dt * 0.18;

    // Breathing scale driven by envelope
    const breathScale = 0.65 + 0.35 * envelope + 0.15 * peak;
    g.scale.setScalar(breathScale);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Cream ambient fill + red energy core for Coca-Cola glow */}
      <pointLight color={CREAM} intensity={1.8} distance={6} />
      <pointLight color={COKE_RED} intensity={2.2} distance={3.5} />

      {/* Clean brand-red glowing icosahedron core */}
      <mesh>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={COKE_RED}
          emissive={COKE_RED}
          emissiveIntensity={1.5}
          roughness={0.35}
          metalness={0.1}
          transparent={false}
        />
      </mesh>

      {/* 3 orbital rings — one per pillar, counter-rotating pairs */}
      {RING_CONFIGS.map((cfg, i) => (
        <OrbitalRing
          key={i}
          torusR={cfg.torusR}
          rotation={cfg.rotation}
          color={cfg.color}
          dir={cfg.dir}
          labelText={PILLAR_LABELS[cfg.pillarIdx] ?? ''}
          matRef={ringMatRefs[i]}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
          peakRef={peakRef}
        />
      ))}

      {/* 8 data dots spiraling inward */}
      {DOT_SEEDS.map((seed, i) => (
        <DataDot
          key={i}
          seed={seed}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
        />
      ))}
    </group>
  );
}
