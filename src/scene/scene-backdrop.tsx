import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useNavigation } from './navigation-context';

// Atmospheric backdrop for the Coca-Cola world.
//
// Skydome approach (not CSS): the EffectComposer outputs an opaque frame, so a
// transparent canvas over a CSS gradient renders black. The gradient must be
// part of the 3-D scene so bloom/vignette can operate on it.
//
// Backdrop layers:
//   1. Inverted skydome — vertical gradient (view-aware palette) composited
//      with a radial corner vignette via shader uniforms.
//   2. InstancedMesh particle field — ~80 cream dust motes drifting slowly
//      downward with slight horizontal drift. Visible only on chapter views.
//
// Palettes:
//   machine  — dusk Atlanta sky, warm amber-burgundy horizon (home/corner-block)
//   chapters — original red atmospheric (role / tools / agent / takeaways)

// ---------------------------------------------------------------------------
// Palette definitions
// ---------------------------------------------------------------------------

interface GradientPalette {
  top: THREE.Color;
  mid: THREE.Color;
  bot: THREE.Color;
}

// Two palette modes: machine = golden-hour Atlanta sky (deep dusk blue at
// zenith → warm peach horizon → deep amber at the ground line), chapters =
// original red atmospheric.
const PALETTES: Record<'machine' | 'chapter', GradientPalette> = {
  machine: {
    top: new THREE.Color('#2A3550'),  // deep dusk navy at zenith
    mid: new THREE.Color('#E8835A'),  // warm peach horizon
    bot: new THREE.Color('#5A2818'),  // amber-brown ground line silhouette
  },
  chapter: {
    top: new THREE.Color('#3A0006'),
    mid: new THREE.Color('#A60010'),
    bot: new THREE.Color('#1A0004'),
  },
};

// The diorama is one continuous golden-hour world; every vantage shares the
// same Atlanta dusk sky (the per-chapter red palette belonged to the old
// abstract scene and is no longer used).
function getPalette(_view: string): GradientPalette {
  return PALETTES.machine;
}

// ---------------------------------------------------------------------------
// Skydome shader
//
// Vertex shader passes the local-space Y position (normalised 0..1 from -1..1)
// to the fragment shader, which blends three colors:
//   bottom (y≈0) → mid (y≈0.45) → top (y≈1)
// A radial corner vignette darkens the four corners toward the "top" color.
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    // Normalize the world-space direction so the gradient is independent
    // of sphere radius (was bug: assumed unit sphere but actual r=45).
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorTop;
  uniform vec3 uColorMid;
  uniform vec3 uColorBot;
  varying vec3 vDir;

  void main() {
    // Direction Y from south pole (-1) to north pole (+1) → remap 0..1
    float t = clamp((vDir.y + 1.0) * 0.5, 0.0, 1.0);

    // Two-segment vertical blend: bot → mid (horizon) → top.
    // Horizon at t=0.50 — peach band sits at eye level.
    vec3 color;
    if (t < 0.50) {
      color = mix(uColorBot, uColorMid, t / 0.50);
    } else {
      color = mix(uColorMid, uColorTop, (t - 0.50) / 0.50);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

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
// DustParticles — gated on chapter views only
// ---------------------------------------------------------------------------

interface DustParticlesProps {
  visible: boolean;
}

function DustParticles({ visible }: DustParticlesProps) {
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
    // Reduced motion freezes animation; visibility gate handled via prop.
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} visible={visible}>
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

// ---------------------------------------------------------------------------
// SceneBackdrop — view-aware gradient skydome + gated dust motes
// ---------------------------------------------------------------------------

// Lerp speed constant: 200ms ≈ lerp factor ~5 per second (approaches target
// in ~200ms with exponential smoothing at dt=0.016).
const COLOR_LERP_SPEED = 5;

export function SceneBackdrop() {
  const { view } = useNavigation();

  // Shader material created once, uniforms mutated in useFrame.
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColorTop: { value: new THREE.Color(PALETTES.chapter.top) },
          uColorMid: { value: new THREE.Color(PALETTES.chapter.mid) },
          uColorBot: { value: new THREE.Color(PALETTES.chapter.bot) },
        },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  // Target color refs — updated reactively when view changes.
  // Current colors are the live uniform values (mutated in useFrame).
  const targetTop = useRef(new THREE.Color(PALETTES.chapter.top));
  const targetMid = useRef(new THREE.Color(PALETTES.chapter.mid));
  const targetBot = useRef(new THREE.Color(PALETTES.chapter.bot));

  // Sync targets whenever view changes.
  useEffect(() => {
    const p = getPalette(view);
    targetTop.current.copy(p.top);
    targetMid.current.copy(p.mid);
    targetBot.current.copy(p.bot);
  }, [view]);

  // Lerp uniforms toward targets each frame (~200ms convergence).
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const alpha = Math.min(1, COLOR_LERP_SPEED * dt);

    shaderMaterial.uniforms.uColorTop.value.lerp(targetTop.current, alpha);
    shaderMaterial.uniforms.uColorMid.value.lerp(targetMid.current, alpha);
    shaderMaterial.uniforms.uColorBot.value.lerp(targetBot.current, alpha);
  });

  useEffect(() => () => shaderMaterial.dispose(), [shaderMaterial]);

  return (
    <>
      {/* Inverted skydome — large enough to enclose the whole diorama
          (extends to z≈107, x≈±120) so far buildings and the skyline read
          against the dusk gradient rather than clipping through it. */}
      <mesh renderOrder={-1} frustumCulled={false} material={shaderMaterial}>
        <sphereGeometry args={[320, 32, 32]} />
      </mesh>

      {/* Floating dust motes drifting through the golden-hour light. */}
      <DustParticles visible />
    </>
  );
}
