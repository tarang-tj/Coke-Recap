import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Bubble particle field. Points-based with per-particle attributes for
// rise speed and horizontal wobble. Recycled at the top of the frustum
// back to the bottom.
//
// Counts: 400 on desktop, ~120 on low-DPR devices.

function detectCount(): number {
  if (typeof navigator === 'undefined') return 220;
  const hw = navigator.hardwareConcurrency ?? 4;
  if (hw <= 4) return 140;
  if (hw <= 6) return 240;
  return 400;
}

const BUBBLE_VERTEX = /* glsl */ `
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;
  uniform float uReducedMotion;

  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * mix(1.0, 0.0, uReducedMotion);
    // Wrap vertically: rise then loop back to the bottom.
    float y = mod(p.y + t * aSpeed, 12.0) - 6.0;
    // Horizontal wobble.
    float x = p.x + 0.18 * sin(aPhase + t * 0.6);
    float z = p.z + 0.18 * cos(aPhase * 1.3 + t * 0.5);

    vec4 mvPos = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (250.0 / -mvPos.z);

    // Fade in at the bottom, out at the top.
    float yFade = smoothstep(-6.0, -4.0, y) * (1.0 - smoothstep(4.0, 6.0, y));
    vAlpha = yFade * 0.55;
  }
`;

const BUBBLE_FRAGMENT = /* glsl */ `
  precision highp float;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // Soft disc with a slight rim highlight.
    float rim = smoothstep(0.5, 0.35, d);
    float core = smoothstep(0.5, 0.0, d) * 0.6;
    float a = (rim * 0.7 + core) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.88), a);
  }
`;

export function Bubbles() {
  const reduced = useReducedMotion();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const count = useMemo(detectCount, []);

  const { positions, speeds, phases, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      speeds[i] = 0.25 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 1.2 + Math.random() * 2.4;
    }
    return { positions, speeds, phases, sizes };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReducedMotion: { value: reduced ? 1 : 0 },
    }),
    [reduced],
  );

  useFrame((_, dt) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;
    m.uniforms.uReducedMotion.value = reduced ? 1 : 0;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          args={[speeds, 1]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={BUBBLE_VERTEX}
        fragmentShader={BUBBLE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
