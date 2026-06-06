import { useRef, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// Act 1 — Role
// Central refracting sphere + 8 CatmullRomCurve3 tube streams + 12 orbiting particles.
// Under bloom, emissive streams read as flowing data ribbons.

const CREAM = '#F1E9DA';
const CARAMEL = '#A06A00';

// 8 stream configs with varied tilts across the sphere
const STREAM_CONFIGS = [
  { tiltX: 0.30,  tiltZ: 0.10,  emissive: CREAM   },
  { tiltX: -0.50, tiltZ: 0.40,  emissive: CARAMEL },
  { tiltX: 0.80,  tiltZ: -0.30, emissive: CREAM   },
  { tiltX: -0.20, tiltZ: -0.60, emissive: CARAMEL },
  { tiltX: 1.10,  tiltZ: 0.50,  emissive: CREAM   },
  { tiltX: -0.70, tiltZ: -0.10, emissive: CARAMEL },
  { tiltX: 0.15,  tiltZ: 0.85,  emissive: CREAM   },
  { tiltX: -0.95, tiltZ: 0.65,  emissive: CARAMEL },
];

// 12 particle orbit configs
const PARTICLE_CONFIGS = Array.from({ length: 12 }, (_, i) => ({
  orbitRadius: 0.9 + (i % 3) * 0.28,
  speed: 0.4 + (i % 4) * 0.22,
  phaseOffset: (i / 12) * Math.PI * 2,
  axisAngle: (i / 12) * Math.PI,
}));

function buildStreamCurve(tiltX: number, tiltZ: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const SEGS = 12;
  const radius = 0.82;
  for (let i = 0; i <= SEGS; i++) {
    const angle = (i / SEGS) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * Math.cos(tiltX);
    const z = Math.sin(angle) * radius * Math.sin(tiltX) + Math.cos(angle) * tiltZ * 0.3;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
}

interface StreamMeshProps {
  tiltX: number;
  tiltZ: number;
  emissiveColor: string;
  matRef: RefObject<THREE.MeshStandardMaterial | null>;
}

function StreamMesh({ tiltX, tiltZ, emissiveColor, matRef }: StreamMeshProps) {
  const geometry = useMemo(() => {
    const curve = buildStreamCurve(tiltX, tiltZ);
    return new THREE.TubeGeometry(curve, 80, 0.016, 8, true);
  }, [tiltX, tiltZ]);

  const colorObj = useMemo(() => new THREE.Color(emissiveColor), [emissiveColor]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color={colorObj}
        emissive={colorObj}
        emissiveIntensity={1.5}
        roughness={0.15}
        metalness={0.05}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

interface ParticleProps {
  orbitRadius: number;
  speed: number;
  phaseOffset: number;
  axisAngle: number;
  reduced: boolean;
  elapsedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function OrbitParticle({ orbitRadius, speed, phaseOffset, axisAngle, reduced, elapsedRef, envelopeRef }: ParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const axis = useMemo(
    () => new THREE.Vector3(Math.sin(axisAngle), Math.cos(axisAngle * 0.7), Math.sin(axisAngle * 1.3)).normalize(),
    [axisAngle],
  );
  const perp = useMemo(() => {
    const p = new THREE.Vector3(1, 0, 0);
    if (Math.abs(axis.x) > 0.9) p.set(0, 1, 0);
    p.cross(axis).normalize();
    return p;
  }, [axis]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const elapsed = elapsedRef.current;
    const envelope = envelopeRef.current;
    const angle = reduced ? phaseOffset : elapsed * speed + phaseOffset;
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const pos = perp.clone().multiplyScalar(orbitRadius).applyQuaternion(q);
    mesh.position.copy(pos);
    mat.opacity = 0.7 * envelope;
    mat.emissiveIntensity = 2.0 * envelope;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.038, 8, 8]} />
      <meshStandardMaterial
        ref={matRef}
        color={CREAM}
        emissive={CREAM}
        emissiveIntensity={2.0}
        roughness={0.1}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

export function ActRole() {
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();
  const groupRef = useRef<THREE.Group>(null);

  const elapsedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(1);

  // One material ref per stream for emissive pulsing
  const streamMatRefs = useMemo<RefObject<THREE.MeshStandardMaterial | null>[]>(
    () => STREAM_CONFIGS.map(() => ({ current: null })),
    [],
  );

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('role', globalT);

    g.visible = active;
    if (!active) return;

    const envelope = actEnvelope(localT);
    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;

    if (!reduced) g.rotation.y += dt * 0.2;

    const s = 0.5 + 0.5 * envelope;
    g.scale.setScalar(s);

    // Emissive pulse 1.0–2.5 driven by localT
    const pulse = 1.0 + 1.5 * (0.5 + 0.5 * Math.sin(localT * Math.PI * 2.5));
    for (const ref of streamMatRefs) {
      const m = ref.current;
      if (!m) continue;
      m.emissiveIntensity = pulse * envelope;
      m.opacity = 0.5 + 0.45 * envelope;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight color={CARAMEL} intensity={1.5} distance={5} />
      <pointLight position={[0, 2, 2]} intensity={1.0} color={CREAM} />

      {/* Refracting central sphere — red tint, glassy */}
      <mesh>
        <sphereGeometry args={[0.7, 64, 32]} />
        <meshPhysicalMaterial
          transmission={0.85}
          roughness={0.08}
          ior={1.5}
          thickness={0.5}
          color="#F40009"
          attenuationColor="#F40009"
          attenuationDistance={2.0}
          transparent
        />
      </mesh>

      {/* 8 data streams */}
      {STREAM_CONFIGS.map((cfg, i) => (
        <StreamMesh
          key={i}
          tiltX={cfg.tiltX}
          tiltZ={cfg.tiltZ}
          emissiveColor={cfg.emissive}
          matRef={streamMatRefs[i]}
        />
      ))}

      {/* 12 orbiting particles */}
      {PARTICLE_CONFIGS.map((cfg, i) => (
        <OrbitParticle
          key={i}
          orbitRadius={cfg.orbitRadius}
          speed={cfg.speed}
          phaseOffset={cfg.phaseOffset}
          axisAngle={cfg.axisAngle}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
        />
      ))}
    </group>
  );
}
