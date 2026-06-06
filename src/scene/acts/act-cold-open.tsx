import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// Act 0 — Cold Open
// Glowing Coke-red icosahedron at origin with 4 orbiting satellite spheres.
// Strong emissive output pairs with bloom postprocessing for an ember effect.

const CREAM_EMISSIVE = '#F1E9DA';

interface SatelliteConfig {
  radius: number;
  orbitRadius: number;
  speed: number;
  axis: THREE.Vector3;
  phaseOffset: number;
}

const SATELLITE_CONFIGS: SatelliteConfig[] = [
  { radius: 0.12, orbitRadius: 0.8,  speed: 1.10, axis: new THREE.Vector3(1, 0, 0).normalize(),            phaseOffset: 0.0 },
  { radius: 0.12, orbitRadius: 1.1,  speed: 0.70, axis: new THREE.Vector3(0, 1, 0.4).normalize(),          phaseOffset: 1.2 },
  { radius: 0.12, orbitRadius: 1.6,  speed: 0.50, axis: new THREE.Vector3(0.5, 0, 1).normalize(),          phaseOffset: 2.4 },
  { radius: 0.12, orbitRadius: 2.0,  speed: 0.35, axis: new THREE.Vector3(-0.3, 1, 0.6).normalize(),       phaseOffset: 0.7 },
];

interface SatelliteProps {
  cfg: SatelliteConfig;
  reduced: boolean;
  elapsedRef: { readonly current: number };
  envelopeRef: { readonly current: number };
}

function Satellite({ cfg, reduced, elapsedRef, envelopeRef }: SatelliteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Compute a stable perpendicular vector to cfg.axis for orbit plane
  const perp = (() => {
    if (Math.abs(cfg.axis.x) < 0.9) {
      return new THREE.Vector3(1, 0, 0).cross(cfg.axis).normalize();
    }
    return new THREE.Vector3(0, 1, 0).cross(cfg.axis).normalize();
  })();

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const elapsed = elapsedRef.current;
    const envelope = envelopeRef.current;

    const angle = reduced ? cfg.phaseOffset : elapsed * cfg.speed + cfg.phaseOffset;
    const q = new THREE.Quaternion().setFromAxisAngle(cfg.axis, angle);
    const pos = perp.clone().multiplyScalar(cfg.orbitRadius).applyQuaternion(q);
    mesh.position.copy(pos);

    mat.opacity = envelope;
    mat.emissiveIntensity = 1.8 * envelope;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[cfg.radius, 12, 12]} />
      <meshStandardMaterial
        ref={matRef}
        color={CREAM_EMISSIVE}
        emissive={CREAM_EMISSIVE}
        emissiveIntensity={1.8}
        roughness={0.2}
        metalness={0.0}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

export function ActColdOpen() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  const elapsedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(1);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const t = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('cold-open', t);

    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const envelope = actEnvelope(localT);
    elapsedRef.current = clock.elapsedTime;
    envelopeRef.current = envelope;

    // Core breathes via scale sin
    if (coreRef.current) {
      const breathe = reduced ? 1.4 : 1.4 + 0.08 * Math.sin(clock.elapsedTime * 1.8);
      coreRef.current.scale.setScalar(breathe);
    }

    // Core emissive fades with envelope — bloom handles the rest
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 2.5 * envelope;
      coreMat.current.opacity = envelope;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight position={[2, 3, 2]} intensity={2.0} color="#F1E9DA" />
      <pointLight position={[-2, -1, 1]} intensity={1.2} color="#A06A00" />

      {/* Coke-red glowing icosahedron core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#F40009"
          emissive="#F40009"
          emissiveIntensity={2.5}
          roughness={0.3}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>

      {/* 4 orbiting satellites — emissive cream, bloom gives them a halo */}
      {SATELLITE_CONFIGS.map((cfg, i) => (
        <Satellite
          key={i}
          cfg={cfg}
          reduced={reduced}
          elapsedRef={elapsedRef}
          envelopeRef={envelopeRef}
        />
      ))}
    </group>
  );
}
