import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import nebulaVert from '../../shaders/nebula.vert.glsl?raw';
import nebulaFrag from '../../shaders/nebula.frag.glsl?raw';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// ─── constants ────────────────────────────────────────────────────────────────

const RING_RADIUS = 1.2;
const RING_TUBE   = 0.012;
const RING_SEGS   = 64;
const RING_TSEG   = 8;

// Three orbital ring configs: axis tilt (Euler XYZ) + label text + position
// angle on the ring (radians) where the label is placed.
const RING_CONFIGS = [
  { rotation: new THREE.Euler(Math.PI * 0.25,  0,  Math.PI * 0.1),  label: 'Ingest',  labelAngle: 0 },
  { rotation: new THREE.Euler(Math.PI * 0.5,   Math.PI * 0.35, 0),  label: 'Analyze', labelAngle: Math.PI * 0.6 },
  { rotation: new THREE.Euler(Math.PI * 0.15,  Math.PI * 0.7,  Math.PI * 0.4), label: 'Surface', labelAngle: Math.PI * 1.3 },
] as const;

const CREAM = '#F1E9DA';

// Gaussian peak centred at localT = 0.5, width controlled by spread.
function gaussianPeak(localT: number, spread = 5): number {
  return Math.exp(-Math.pow((localT - 0.5) * spread, 2));
}

// ─── sub-component: one orbital ring + label ──────────────────────────────────

interface OrbitalRingProps {
  rotation: THREE.Euler;
  label: string;
  labelAngle: number;
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}

function OrbitalRing({ rotation, label, labelAngle, matRef }: OrbitalRingProps) {
  // Compute label world-position: point on ring circumference, rotated
  // by the ring's euler to match the tilted plane.
  const labelPos = useMemo<[number, number, number]>(() => {
    const localX = Math.cos(labelAngle) * (RING_RADIUS + 0.22);
    const localZ = Math.sin(labelAngle) * (RING_RADIUS + 0.22);
    const v = new THREE.Vector3(localX, 0, localZ);
    v.applyEuler(rotation);
    return [v.x, v.y, v.z];
  }, [rotation, labelAngle]);

  return (
    <>
      {/* Tilted torus ring */}
      <group rotation={rotation}>
        <mesh>
          <torusGeometry args={[RING_RADIUS, RING_TUBE, RING_TSEG, RING_SEGS]} />
          <meshStandardMaterial
            ref={matRef}
            color={CREAM}
            emissive={CREAM}
            emissiveIntensity={0.8}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* Label at world-space ring edge, always facing camera */}
      <Billboard position={labelPos} follow={true}>
        <Text
          color={CREAM}
          fontSize={0.14}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </>
  );
}

// ─── main act ─────────────────────────────────────────────────────────────────

export function ActAgent() {
  const scrollRef  = useScrollRef();
  const reduced    = useReducedMotion();
  const groupRef   = useRef<THREE.Group>(null);
  const nebulaMat  = useRef<THREE.ShaderMaterial>(null);

  // One material ref per ring for independent emissive control.
  const ringMat0 = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat1 = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat2 = useRef<THREE.MeshStandardMaterial>(null);
  const ringMats = [ringMat0, ringMat1, ringMat2] as const;

  const uniforms = useMemo(
    () => ({
      uTime:         { value: 0 },
      uReducedMotion:{ value: reduced ? 1 : 0 },
      uLocalT:       { value: 0 },
    }),
    [reduced],
  );

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('agent', globalT);

    g.visible = active;
    if (!active) return;

    const envelope = actEnvelope(localT);
    const peak     = gaussianPeak(localT);

    // Update nebula shader uniforms.
    const mat = nebulaMat.current;
    if (mat) {
      if (!reduced) mat.uniforms.uTime.value += dt;
      mat.uniforms.uReducedMotion.value = reduced ? 1 : 0;
      mat.uniforms.uLocalT.value        = localT;
    }

    // Slow rotation of the whole group (skip when reduced-motion).
    if (!reduced) {
      g.rotation.y += dt * 0.18;
    }

    // Scale-in with envelope.
    const s = 0.6 + 0.4 * envelope;
    g.scale.setScalar(s);

    // Ring emissive: baseline pulse + Gaussian alignment peak at localT ≈ 0.5.
    const basePulse = 0.5 + 0.5 * Math.sin(localT * Math.PI * 3);
    const ringIntensity = (basePulse * 0.5 + peak * 1.5) * envelope;

    for (const ref of ringMats) {
      const m = ref.current;
      if (!m) continue;
      m.emissiveIntensity = ringIntensity;
      m.opacity           = 0.45 + 0.5 * envelope;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Nebula core — icosahedron with custom additive shader */}
      <mesh>
        <icosahedronGeometry args={[0.6, 4]} />
        <shaderMaterial
          ref={nebulaMat}
          vertexShader={nebulaVert}
          fragmentShader={nebulaFrag}
          uniforms={uniforms}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent={true}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Ambient point light for ring illumination */}
      <pointLight color={CREAM} intensity={1.5} distance={5} />

      {/* Three tilted orbital rings */}
      {RING_CONFIGS.map((cfg, i) => (
        <OrbitalRing
          key={cfg.label}
          rotation={cfg.rotation}
          label={cfg.label}
          labelAngle={cfg.labelAngle}
          matRef={ringMats[i]}
        />
      ))}
    </group>
  );
}
