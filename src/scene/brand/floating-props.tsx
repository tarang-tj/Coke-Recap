import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Atmospheric floating brand props — bottle caps + ice cubes drifting at varied
// depths for parallax. Kept subtle so they don't compete with act centerpieces.
// Instanced meshes share a single draw call each; a reused Object3D dummy avoids
// per-frame allocations.

// ─── instance counts ───────────────────────────────────────────────────────────

function detectCounts(): { caps: number; ice: number } {
  if (typeof navigator === 'undefined') return { caps: 14, ice: 14 };
  const hw = navigator.hardwareConcurrency ?? 4;
  if (hw <= 4) return { caps: 10, ice: 10 };
  if (hw <= 8) return { caps: 14, ice: 14 };
  return { caps: 18, ice: 18 };
}

// ─── seeded random (no external dep) ──────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── per-instance data ────────────────────────────────────────────────────────

interface InstanceData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  // drift phase offsets so every instance has a unique bob cycle
  phaseY: number;
  phaseRot: number;
  // slow rotation axis/speed
  rotSpeed: number;
}

function buildInstances(count: number, seed: number): InstanceData[] {
  const rng = seededRng(seed);
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(
      (rng() - 0.5) * 28,  // x ∈ [-14, 14]
      (rng() - 0.5) * 16,  // y ∈ [-8, 8]
      rng() * 24 - 18,     // z ∈ [-18, 6] — varied depth for parallax
    ),
    rotation: new THREE.Euler(
      rng() * Math.PI * 2,
      rng() * Math.PI * 2,
      rng() * Math.PI * 2,
    ),
    scale: 0.5 + rng() * 0.9,   // 0.5 – 1.4
    phaseY: rng() * Math.PI * 2,
    phaseRot: rng() * Math.PI * 2,
    rotSpeed: (rng() - 0.5) * 0.4, // ±0.2 rad/s
  }));
}

// ─── reusable module-level temporaries (no per-frame allocation) ──────────────

const _dummy = new THREE.Object3D();
const _qDelta = new THREE.Quaternion();
const _axis = new THREE.Vector3(0.3, 1, 0.1).normalize();

// ─── component ────────────────────────────────────────────────────────────────

export function FloatingProps() {
  const reduced = useReducedMotion();
  const { caps: CAP_COUNT } = useMemo(detectCounts, []);

  const capsRef = useRef<THREE.InstancedMesh>(null);

  const capData = useMemo(() => buildInstances(CAP_COUNT, 0xc0ca_c01a), [CAP_COUNT]);

  // Static colors / materials (created once)
  const capColor = useMemo(() => new THREE.Color('#F40009'), []);
  const capEmissive = useMemo(() => new THREE.Color('#B00712'), []);

  // Write initial matrices; also the only write when reduced motion is on.
  useLayoutEffect(() => {
    function applyStatic(
      mesh: THREE.InstancedMesh | null,
      data: InstanceData[],
    ) {
      if (!mesh) return;
      data.forEach((d, i) => {
        _dummy.position.copy(d.position);
        _dummy.rotation.copy(d.rotation);
        _dummy.scale.setScalar(d.scale);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    applyStatic(capsRef.current, capData);
  }, [capData]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;

    function animate(
      mesh: THREE.InstancedMesh | null,
      data: InstanceData[],
    ) {
      if (!mesh) return;
      data.forEach((d, i) => {
        // Gentle Y bob — amplitude 0.18 u so props stay in rough position
        _dummy.position.set(
          d.position.x,
          d.position.y + 0.18 * Math.sin(t * 0.35 + d.phaseY),
          d.position.z,
        );
        // Slow continuous rotation around a tilted axis per instance
        const angle = t * d.rotSpeed + d.phaseRot;
        _qDelta.setFromAxisAngle(_axis, angle);
        _dummy.quaternion.copy(_qDelta);
        _dummy.scale.setScalar(d.scale);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    animate(capsRef.current, capData);
  });

  return (
    <group>
      {/* Bottle caps — Coca-Cola red cylinders with metallic crimped look */}
      <instancedMesh
        ref={capsRef}
        args={[undefined, undefined, CAP_COUNT]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.35, 0.35, 0.12, 20]} />
        <meshStandardMaterial
          color={capColor}
          emissive={capEmissive}
          emissiveIntensity={0.18}
          roughness={0.35}
          metalness={0.2}
        />
      </instancedMesh>

      {/* Fine carbonation sparkles — Drei handles own animation */}
      <Sparkles
        count={60}
        scale={[16, 12, 16]}
        size={2}
        speed={reduced ? 0 : 0.3}
        color="#FFFEF6"
        opacity={0.5}
      />
    </group>
  );
}
