import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Atmospheric backdrop for the Coca-Cola world.
//
// Skydome approach (not CSS): the EffectComposer outputs an opaque frame, so a
// transparent canvas over a CSS gradient renders black. The gradient must be
// part of the 3-D scene so bloom/vignette can operate on it.
//
// Backdrop layers:
//   1. Inverted skydome — vertical gradient (deep burgundy top → brand red
//      horizon → dark wine bottom) composited with a radial corner vignette.
//   2. InstancedMesh particle field — ~80 cream dust motes drifting slowly
//      downward with slight horizontal drift. Conveys volumetric depth without
//      needing fog or transmission.

// ---------------------------------------------------------------------------
// Gradient + vignette texture
// ---------------------------------------------------------------------------

function makeGradientTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  // Vertical gradient: burgundy top → brand red horizon → dark wine bottom.
  // The sphere is inverted so "top" of the canvas maps to the top of the dome.
  const vGrad = ctx.createLinearGradient(0, 0, 0, size);
  vGrad.addColorStop(0.0, '#3A0006');   // deep burgundy at sky apex
  vGrad.addColorStop(0.45, '#A60010');  // brand red at horizon
  vGrad.addColorStop(1.0, '#1A0004');   // dark wine at ground
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, size, size);

  // Radial vignette: multiply-dark corners over the gradient.
  // Canvas doesn't support multiply blend natively, so we approximate by
  // drawing a dark-to-transparent radial gradient on top with globalAlpha.
  ctx.globalCompositeOperation = 'multiply';
  const rGrad = ctx.createRadialGradient(
    size * 0.5, size * 0.5, size * 0.18,
    size * 0.5, size * 0.5, size * 0.72
  );
  rGrad.addColorStop(0.0, '#ffffff');   // transparent center (multiply by white = no change)
  rGrad.addColorStop(1.0, '#3a0006');   // darken corners toward burgundy
  ctx.fillStyle = rGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Soft circular disc texture for dust motes
// ---------------------------------------------------------------------------

function makeDustTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,240,210,1)');
  g.addColorStop(0.4, 'rgba(255,240,210,0.6)');
  g.addColorStop(1.0, 'rgba(255,240,210,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Deterministic seeded pseudo-random (no external dep)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Particle field constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 80;
const BOUNDS = {
  x: [-8, 8] as [number, number],
  y: [-5, 6] as [number, number],
  z: [-4, 4] as [number, number],
};
const PARTICLE_SIZE = 0.09; // world-units radius of each disc

// Per-particle drift velocities seeded deterministically so SSR/hydration is
// consistent and reduced-motion restart lands on known positions.
interface ParticleState {
  pos: THREE.Vector3;
  vel: THREE.Vector3; // units/sec
  opacity: number;
}

function buildParticles(): ParticleState[] {
  const rand = seededRandom(42);
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const x = BOUNDS.x[0] + rand() * (BOUNDS.x[1] - BOUNDS.x[0]);
    const y = BOUNDS.y[0] + rand() * (BOUNDS.y[1] - BOUNDS.y[0]);
    const z = BOUNDS.z[0] + rand() * (BOUNDS.z[1] - BOUNDS.z[0]);
    // Slow downward drift + gentle side breeze. No upward drift (not snow).
    const vx = (rand() - 0.5) * 0.08;
    const vy = -(0.04 + rand() * 0.10); // always downward
    const vz = (rand() - 0.5) * 0.05;
    const opacity = 0.15 + rand() * 0.15; // 0.15 – 0.30
    return {
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(vx, vy, vz),
      opacity,
    };
  });
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function DustParticles() {
  const reduced = useReducedMotion();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dustTex = useMemo(makeDustTexture, []);
  const particles = useMemo(buildParticles, []);

  // Scratch objects — avoid per-frame allocation
  const _mat = useMemo(() => new THREE.Matrix4(), []);
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _scale = useMemo(() => new THREE.Vector3(), []);

  // Write initial matrices once on mount
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    particles.forEach((p, i) => {
      _pos.copy(p.pos);
      _scale.setScalar(PARTICLE_SIZE);
      _mat.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [particles, _mat, _pos, _quat, _scale]);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || reduced) return;

    const dt = Math.min(delta, 0.05); // clamp to avoid huge jumps
    particles.forEach((p, i) => {
      p.pos.addScaledVector(p.vel, dt);

      // Recycle out-of-bounds particles by wrapping
      if (p.pos.y < BOUNDS.y[0]) p.pos.y = BOUNDS.y[1];
      if (p.pos.x < BOUNDS.x[0]) p.pos.x = BOUNDS.x[1];
      if (p.pos.x > BOUNDS.x[1]) p.pos.x = BOUNDS.x[0];
      if (p.pos.z < BOUNDS.z[0]) p.pos.z = BOUNDS.z[1];
      if (p.pos.z > BOUNDS.z[1]) p.pos.z = BOUNDS.z[0];

      _pos.copy(p.pos);
      _scale.setScalar(PARTICLE_SIZE);
      _mat.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => () => dustTex.dispose(), [dustTex]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={dustTex}
        transparent
        opacity={0.22}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

export function SceneBackdrop() {
  const texture = useMemo(makeGradientTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <>
      {/* Inverted skydome — vertical gradient + radial vignette */}
      <mesh renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[45, 32, 32]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Atmospheric dust motes — depth cue without fog/transmission */}
      <DustParticles />
    </>
  );
}
