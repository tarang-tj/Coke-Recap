import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// 3–4 glowing data streams curving around a glass sphere.
// Streams are CatmullRomCurve3 tubes at different latitude-band tilts.

function buildStreamCurve(
  tiltX: number,
  tiltZ: number,
  radius: number,
  segments: number,
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = Math.cos(t) * radius;
    const y = Math.sin(t) * radius * Math.cos(tiltX);
    const z = Math.sin(t) * radius * Math.sin(tiltX) + Math.cos(t) * tiltZ * 0.3;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
}

const STREAM_CONFIGS: Array<{ tiltX: number; tiltZ: number; hue: number }> = [
  { tiltX: 0.3,  tiltZ: 0.1,  hue: 0.08 },  // warm amber
  { tiltX: -0.5, tiltZ: 0.4,  hue: 0.06 },  // cream-gold
  { tiltX: 0.8,  tiltZ: -0.3, hue: 0.07 },  // caramel
  { tiltX: -0.2, tiltZ: -0.6, hue: 0.09 },  // bright amber
];

interface StreamMeshProps {
  tiltX: number;
  tiltZ: number;
  hue: number;
  materialRef: RefObject<THREE.MeshStandardMaterial | null>;
}

function StreamMesh({ tiltX, tiltZ, hue, materialRef }: StreamMeshProps) {
  const geometry = useMemo(() => {
    const curve = buildStreamCurve(tiltX, tiltZ, 0.82, 10);
    return new THREE.TubeGeometry(curve, 64, 0.018, 8, true);
  }, [tiltX, tiltZ]);

  const color = useMemo(() => new THREE.Color().setHSL(hue, 0.9, 0.6), [hue]);
  const emissive = useMemo(() => new THREE.Color().setHSL(hue, 1.0, 0.4), [hue]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={emissive}
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

export function ActRole() {
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();
  const groupRef = useRef<THREE.Group>(null);

  // One material ref per stream for emissive pulsing
  const mat0 = useRef<THREE.MeshStandardMaterial>(null);
  const mat1 = useRef<THREE.MeshStandardMaterial>(null);
  const mat2 = useRef<THREE.MeshStandardMaterial>(null);
  const mat3 = useRef<THREE.MeshStandardMaterial>(null);
  // Typed as tuple so index access is non-nullable
  const matRefs: [
    RefObject<THREE.MeshStandardMaterial | null>,
    RefObject<THREE.MeshStandardMaterial | null>,
    RefObject<THREE.MeshStandardMaterial | null>,
    RefObject<THREE.MeshStandardMaterial | null>,
  ] = [mat0, mat1, mat2, mat3];

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('role', globalT);

    g.visible = active;
    if (!active) return;

    const envelope = actEnvelope(localT);

    // Slow Y rotation driven by localT (or real time for reduced motion)
    if (!reduced) {
      g.rotation.y += dt * 0.25;
    }

    // Scale envelope
    const s = 0.5 + 0.5 * envelope;
    g.scale.setScalar(s);

    // Pulse emissive on all stream materials
    const pulse = 0.6 + 0.4 * Math.sin(localT * Math.PI * 2);
    for (const ref of matRefs) {
      const m = ref.current;
      if (m) {
        m.emissiveIntensity = pulse * envelope;
        m.opacity = 0.5 + 0.45 * envelope;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Glass sphere */}
      <mesh>
        <sphereGeometry args={[0.7, 64, 32]} />
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.4}
          roughness={0.08}
          ior={1.5}
          color="#F1E9DA"
          transparent
        />
      </mesh>

      {/* Data streams */}
      {STREAM_CONFIGS.map((cfg, i) => (
        <StreamMesh
          key={i}
          tiltX={cfg.tiltX}
          tiltZ={cfg.tiltZ}
          hue={cfg.hue}
          materialRef={matRefs[i]}
        />
      ))}

      {/* Ambient glow point light */}
      <pointLight color="#A06A00" intensity={1.2} distance={4} />
    </group>
  );
}
