import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import nebulaVert from '../../shaders/nebula.vert.glsl?raw';
import nebulaFrag from '../../shaders/nebula.frag.glsl?raw';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { agent } from '../../data/portfolio-content';

// Act 3 — Agent (centerpiece)
// Nebula icosahedron core + 5 orbital rings + 30 spiraling data dots.
// Gaussian brightness peak at localT=0.5 makes the whole act "ignite".

const CREAM = '#F1E9DA';
const CARAMEL = '#A06A00';

// Gaussian peak centred at localT=0.5
function gaussianPeak(localT: number): number {
  return Math.exp(-Math.pow((localT - 0.5) * 4, 2));
}

// ─── 5 orbital ring configs ───────────────────────────────────────────────────
const RING_CONFIGS = [
  { torusR: 1.20, rotation: new THREE.Euler(Math.PI * 0.25,  0,              Math.PI * 0.10), color: CREAM,   dir:  1, labelIndex: 0 },
  { torusR: 1.45, rotation: new THREE.Euler(Math.PI * 0.50,  Math.PI * 0.35, 0             ), color: CARAMEL, dir: -1, labelIndex: -1 },
  { torusR: 1.70, rotation: new THREE.Euler(Math.PI * 0.15,  Math.PI * 0.70, Math.PI * 0.40), color: CREAM,   dir:  1, labelIndex: 2 },
  { torusR: 1.95, rotation: new THREE.Euler(Math.PI * 0.60,  Math.PI * 0.15, Math.PI * 0.55), color: CARAMEL, dir: -1, labelIndex: -1 },
  { torusR: 2.20, rotation: new THREE.Euler(Math.PI * 0.35,  Math.PI * 0.80, Math.PI * 0.20), color: CREAM,   dir:  1, labelIndex: 4 },
] as const;

const RING_TUBE = 0.012;
const RING_SEGS = 80;
const RING_TSEG = 8;

// Label data from pillars (indices 0, 2, 4 → rings 0, 2, 4)
const PILLAR_LABELS = agent.pillars.map((p) => p.name); // ['Ingest','Analyze','Surface']

interface OrbitalRingProps {
  torusR: number;
  rotation: THREE.Euler;
  color: string;
  dir: number;
  labelText: string | null;
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

    if (!reduced) g.rotation.z += dt * 0.35 * dir;

    const envelope = envelopeRef.current;
    const peak = peakRef.current;
    const basePulse = 0.6 + 0.4 * Math.sin(elapsedRef.current * 1.2);
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

      {labelText && (
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
      )}
    </>
  );
}

// ─── 30 spiraling data dots ───────────────────────────────────────────────────
// Logarithmic spiral: start far out, animate inward, recycle.

const DOT_COUNT = 30;

// Static spiral seed positions (angle + initial radius offset per dot)
const DOT_SEEDS = Array.from({ length: DOT_COUNT }, (_, i) => ({
  angleOffset: (i / DOT_COUNT) * Math.PI * 6,   // spread across 3 full turns
  radiusBase: 1.8 + (i % 5) * 0.18,             // 1.8 → 2.52
  speed: 0.12 + (i % 4) * 0.06,                  // inward drift speed
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
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();
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

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('agent', globalT);

    g.visible = active;
    if (!active) return;

    const envelope = actEnvelope(localT);
    const peak = gaussianPeak(localT);

    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;
    peakRef.current = peak;

    // Nebula shader uniforms
    const mat = nebulaMat.current;
    if (mat) {
      if (!reduced) mat.uniforms.uTime.value += dt;
      mat.uniforms.uReducedMotion.value = reduced ? 1.0 : 0.0;
      mat.uniforms.uLocalT.value = localT;
    }

    if (!reduced) g.rotation.y += dt * 0.18;

    // Gaussian breathing scale — peaks at localT=0.5
    const breathScale = 0.65 + 0.35 * envelope + 0.15 * peak;
    g.scale.setScalar(breathScale);
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight color={CREAM} intensity={1.8} distance={6} />
      <pointLight position={[0, 2, 0]} color="#F40009" intensity={1.2} distance={4} />

      {/* Nebula core — icosahedron detail=3 with upgraded shader */}
      <mesh>
        <icosahedronGeometry args={[0.7, 3]} />
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

      {/* 5 orbital rings — counter-rotating pairs */}
      {RING_CONFIGS.map((cfg, i) => (
        <OrbitalRing
          key={i}
          torusR={cfg.torusR}
          rotation={cfg.rotation}
          color={cfg.color}
          dir={cfg.dir}
          labelText={cfg.labelIndex >= 0 ? PILLAR_LABELS[Math.floor(cfg.labelIndex / 2)] ?? null : null}
          matRef={ringMatRefs[i]}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
          peakRef={peakRef}
        />
      ))}

      {/* 30 data dots spiraling inward */}
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
