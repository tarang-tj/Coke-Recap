import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Atmospheric dust motes drifting in the gas-lamp light.
// One THREE.Points for all three lamps → single draw call.
// Each mote lives in a soft cone under the lamp globe head,
// slowly rising/falling with a lateral wander. Zero per-frame allocations.

// Globe positions from street-lamps.tsx (y=4.75 is the globe centre).
const GLOBES: [number, number, number][] = [
  [-3.5, 4.75, -5.7],
  [6.8, 4.75, -5.7],
  [14.0, 4.75, -5.7],
];

const MOTES_PER_LAMP = 30; // 3 × 30 = 90 total, well under 300
const TOTAL = GLOBES.length * MOTES_PER_LAMP;

// Cone geometry: motes drift within a cylinder of radius CONE_R centred on
// the globe, spanning CONE_BOT..CONE_TOP relative to the globe y.
const CONE_R = 0.9; // metres radial spread
const CONE_TOP = 0.35; // just above globe centre
const CONE_BOT = -2.2; // ~2.2m below globe

// Motion parameters (units/sec)
const RISE_SPEED = 0.06; // net upward drift
const WANDER_AMP = 0.18; // lateral oscillation amplitude
const WANDER_FREQ = 0.55; // oscillation frequency multiplier

// Tiny deterministic LCG matching cloud house style.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

// Per-mote state packed into plain arrays (no objects → no GC pressure).
// All allocated once at module scope — component just reads/writes them.
const phases = new Float32Array(TOTAL); // [0..2π] oscillation phase
const speeds = new Float32Array(TOTAL); // rise speed per mote (small variance)
const radii = new Float32Array(TOTAL); // radial distance from lamp axis
const angles = new Float32Array(TOTAL); // base angle around lamp axis
const yOffsets = new Float32Array(TOTAL); // initial y offset within cone

(function initTables() {
  const rnd = lcg(42);
  for (let i = 0; i < TOTAL; i++) {
    phases[i] = rnd() * Math.PI * 2;
    speeds[i] = RISE_SPEED * (0.6 + rnd() * 0.8);
    // Distribute radially: sqrt of uniform → uniform area distribution
    radii[i] = CONE_R * Math.sqrt(rnd());
    angles[i] = rnd() * Math.PI * 2;
    yOffsets[i] = CONE_BOT + rnd() * (CONE_TOP - CONE_BOT);
  }
})();

export function LampMotes() {
  const reduced = useReducedMotion();

  // Preallocated position buffer — written every frame, never reallocated.
  const posArr = useMemo(() => new Float32Array(TOTAL * 3), []);

  // Track per-mote y offset in a ref so it persists across frames.
  const yState = useRef<Float32Array>(new Float32Array(yOffsets));

  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  // Dispose geometry + material on unmount.
  useEffect(() => {
    const geo = geoRef.current;
    const mat = matRef.current;
    return () => {
      geo?.dispose();
      mat?.dispose();
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const geo = geoRef.current;
    if (!geo) return;

    const t = clock.elapsedTime;
    const pos = posArr;
    const ys = yState.current;

    for (let li = 0; li < GLOBES.length; li++) {
      const [gx, gy, gz] = GLOBES[li];
      const base = li * MOTES_PER_LAMP;

      for (let mi = 0; mi < MOTES_PER_LAMP; mi++) {
        const idx = base + mi;
        const ph = phases[idx];

        // Rise — wrap back to bottom when a mote floats above the cone top.
        ys[idx] += speeds[idx] * delta;
        if (ys[idx] > CONE_TOP) ys[idx] = CONE_BOT;

        // Lateral wander — cheap Lissajous on x/z.
        const wx = WANDER_AMP * Math.sin(t * WANDER_FREQ + ph);
        const wz = WANDER_AMP * Math.cos(t * WANDER_FREQ * 0.73 + ph + 1.1);

        const ang = angles[idx];
        const r = radii[idx];

        const i3 = idx * 3;
        pos[i3] = gx + r * Math.cos(ang) + wx;
        pos[i3 + 1] = gy + ys[idx];
        pos[i3 + 2] = gz + r * Math.sin(ang) + wz;
      }
    }

    const attr = geo.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  // Static fallback positions (used both for initial render and reduced motion).
  const staticPos = useMemo(() => {
    const arr = new Float32Array(TOTAL * 3);
    for (let li = 0; li < GLOBES.length; li++) {
      const [gx, gy, gz] = GLOBES[li];
      const base = li * MOTES_PER_LAMP;
      for (let mi = 0; mi < MOTES_PER_LAMP; mi++) {
        const idx = base + mi;
        const r = radii[idx];
        const ang = angles[idx];
        const i3 = idx * 3;
        arr[i3] = gx + r * Math.cos(ang);
        arr[i3 + 1] = gy + yOffsets[idx];
        arr[i3 + 2] = gz + r * Math.sin(ang);
      }
    }
    return arr;
  }, []);

  // Populate the live buffer from static layout on first render.
  useMemo(() => posArr.set(staticPos), [posArr, staticPos]);

  // Under reduced motion hold the static positions (no useFrame mutation path).
  // The frozen positions are set once into the buffer; after that the geo just
  // stays still — no per-frame write needed.
  const prevReduced = useRef(reduced);
  useEffect(() => {
    if (reduced && !prevReduced.current) {
      // Switched into reduced motion — freeze positions.
      posArr.set(staticPos);
      const attr = geoRef.current?.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;
    }
    prevReduced.current = reduced;
  }, [reduced, posArr, staticPos]);

  return (
    <points raycast={() => null}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[posArr, 3]}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color="#FFB953"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        vertexColors={false}
      />
    </points>
  );
}
