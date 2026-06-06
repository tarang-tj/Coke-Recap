import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import nebulaVert from '../../shaders/nebula.vert.glsl?raw';
import nebulaFrag from '../../shaders/nebula.frag.glsl?raw';
import { useNavigation } from '../navigation-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { agent } from '../../data/portfolio-content';
import { DynamicRibbon } from '../brand/dynamic-ribbon';

// Act 3 — Agent (centerpiece)
// Trimmed: 3 orbital rings, 16 data dots, detail-2 icosahedron core.
// Two brand ribbons weave through for Coca-Cola flavor.

const CREAM = '#F1E9DA';
const CARAMEL = '#A06A00';
const COKE_RED = '#E8000B';

// ─── 3 orbital ring configs (trimmed from 5) ──────────────────────────────────
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

// ─── 16 spiraling data dots (trimmed from 30) ─────────────────────────────────
const DOT_COUNT = 16;

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
  const { view } = useNavigation();
  const reduced = useReducedMotion();

  // View-state envelope: damped 0→1 when 'agent' is active, 1→0 otherwise
  const viewRef = useRef(view); viewRef.current = view;
  const envRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const nebulaMat = useRef<THREE.ShaderMaterial>(null);

  const elapsedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(1);
  const peakRef = useRef<number>(0);

  const ringMatRefs = useMemo<RefObject<THREE.MeshStandardMaterial | null>[]>(
    () => RING_CONFIGS.map(() => ({ current: null })),
    [],
  );

  const uniforms = useMemo(
    () => ({
      uTime:          { value: 0 },
      uReducedMotion: { value: reduced ? 1.0 : 0.0 },
      uLocalT:        { value: 0 },
    }),
    [reduced],
  );

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    // Critically damped fade in/out (~0.4 s time constant)
    const target = viewRef.current === 'agent' ? 1 : 0;
    envRef.current += (target - envRef.current) * Math.min(1, dt * 4);
    const active = envRef.current > 0.002;

    g.visible = active;
    if (!active) return;

    const envelope = envRef.current;
    // Envelope doubles as the ignition peak (bright as view focuses)
    const peak = envelope;

    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;
    peakRef.current = peak;

    // Nebula shader uniforms
    const mat = nebulaMat.current;
    if (mat) {
      if (!reduced) mat.uniforms.uTime.value += dt;
      mat.uniforms.uReducedMotion.value = reduced ? 1.0 : 0.0;
      mat.uniforms.uLocalT.value = envelope;
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

      {/* Nebula core — icosahedron detail lowered to 2 for performance */}
      <mesh>
        <icosahedronGeometry args={[0.7, 2]} />
        <shaderMaterial
          ref={nebulaMat}
          vertexShader={nebulaVert}
          fragmentShader={nebulaFrag}
          uniforms={uniforms}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          side={THREE.FrontSide}
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

      {/* 16 data dots spiraling inward (trimmed from 30) */}
      {DOT_SEEDS.map((seed, i) => (
        <DataDot
          key={i}
          seed={seed}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
        />
      ))}

      {/* Brand ribbons — Coca-Cola swoosh weaves through the centerpiece.
          Scaled down so the full ribbon arc fits within the ring orbits.
          Both instances inherit the parent group's y-rotation for free orbiting. */}
      <DynamicRibbon
        scale={0.46}
        color={COKE_RED}
        speed={0.65}
        opacity={0.72}
        position={[0, 0.18, 0]}
        rotation={[Math.PI * 0.12, Math.PI * 0.28, 0]}
      />
      <DynamicRibbon
        scale={0.38}
        color={CREAM}
        speed={0.45}
        opacity={0.50}
        position={[0, -0.14, 0]}
        rotation={[Math.PI * 0.58, Math.PI * 0.72, Math.PI * 0.22]}
      />
    </group>
  );
}
