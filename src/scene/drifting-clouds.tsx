import { useEffect, useMemo, useRef } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Subtle drifting clouds — billboard planes far behind/above the diorama
// block (block spans z -2..+107; skydome radius 320). Soft procedural
// CanvasTexture blobs, warm white-peach tint to sit in the golden-hour grade.
// They must read as atmosphere, not a weather event: low opacity, slow drift.

// Deterministic LCG so the cloud shapes are stable across loads.
function makeCloudTexture(seed: number): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  for (let i = 0; i < 7; i++) {
    const cx = w * (0.22 + rnd() * 0.56);
    const cy = h * (0.34 + rnd() * 0.3);
    const r = h * (0.18 + rnd() * 0.24);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const a = 0.4 + rnd() * 0.3;
    g.addColorStop(0, `rgba(255,242,226,${a.toFixed(3)})`); // #FFF2E2
    g.addColorStop(1, 'rgba(255,242,226,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// x in [-80..80], y in [26..42], z in [55..100]; opacity 0.22-0.38;
// drift v in units/sec (a few units per minute).
const CLOUDS = [
  { x: -70, y: 31, z: 62, w: 34, h: 12, o: 0.3, v: 0.09, tex: 0 },
  { x: -38, y: 39, z: 88, w: 44, h: 15, o: 0.24, v: 0.05, tex: 1 },
  { x: -6, y: 27, z: 70, w: 28, h: 10, o: 0.34, v: 0.11, tex: 2 },
  { x: 24, y: 41, z: 97, w: 46, h: 16, o: 0.22, v: 0.06, tex: 0 },
  { x: 52, y: 33, z: 64, w: 30, h: 11, o: 0.32, v: 0.1, tex: 1 },
  { x: 78, y: 28, z: 84, w: 36, h: 12, o: 0.27, v: 0.07, tex: 2 },
];
const X_WRAP = 95;

export function DriftingClouds() {
  const reduced = useReducedMotion();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  const textures = useMemo(
    () => [makeCloudTexture(11), makeCloudTexture(47), makeCloudTexture(83)],
    [],
  );
  useEffect(() => {
    return () => textures.forEach((t) => t.dispose());
  }, [textures]);

  useFrame((_, delta) => {
    if (reduced) return; // static sky under reduced motion
    for (let i = 0; i < CLOUDS.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      g.position.x += CLOUDS[i].v * delta;
      if (g.position.x > X_WRAP) g.position.x = -X_WRAP;
    }
  });

  return (
    <>
      {CLOUDS.map((c, i) => (
        <Billboard
          key={i}
          ref={(g: THREE.Group | null) => {
            groupRefs.current[i] = g;
          }}
          position={[c.x, c.y, c.z]}
        >
          <mesh scale={[c.w, c.h, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={textures[c.tex]}
              transparent
              opacity={c.o}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}
