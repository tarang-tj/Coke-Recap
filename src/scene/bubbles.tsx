import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Bubble particle field — additive blending so bubbles bloom with postprocessing.
// Counts slightly bumped (80/60/40 → 100/70/50) — still cheap on the red bg.
// Fragment color is bright white/cream so carbonation reads clearly against red.

function detectCount(): number {
  if (typeof navigator === 'undefined') return 70;
  const hw = navigator.hardwareConcurrency ?? 4;
  if (hw <= 4) return 50;
  if (hw <= 8) return 70;
  return 100;
}

const BUBBLE_VERTEX = /* glsl */ `
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;
  uniform float uReducedMotion;
  uniform vec2  uPointer;        // cursor NDC position, x/y ∈ [-1,1]
  uniform float uPointerStrength; // 1.0 normal, 0.0 reduced-motion

  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * mix(1.0, 0.0, uReducedMotion);
    float y = mod(p.y + t * aSpeed, 12.0) - 6.0;
    float x = p.x + 0.18 * sin(aPhase + t * 0.6);
    float z = p.z + 0.18 * cos(aPhase * 1.3 + t * 0.5);

    vec4 mvPos = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (250.0 / -mvPos.z);

    // Cursor repulsion: push bubbles outward from the pointer in clip space.
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vec2 toBubble = ndc - uPointer;
    float dist = length(toBubble);
    // Gaussian falloff — strong within ~0.3 NDC units, fades quickly beyond.
    float push = uPointerStrength * 0.12 * exp(-dist * dist * 6.0);
    // Multiply by w to keep push magnitude consistent in clip space.
    gl_Position.xy += normalize(toBubble + 1e-5) * push * gl_Position.w;

    float yFade = smoothstep(-6.0, -4.0, y) * (1.0 - smoothstep(4.0, 6.0, y));
    vAlpha = yFade * 0.65;
  }
`;

const BUBBLE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float rim = smoothstep(0.5, 0.3, d);
    float core = smoothstep(0.5, 0.0, d) * 0.7;
    float a = (rim * 0.8 + core) * vAlpha;
    // Bright white/cream so carbonation reads clearly against red background.
    gl_FragColor = vec4(1.0, 0.97, 0.92, a);
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
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: reduced ? 0 : 1 },
    }),
    // uniforms object is stable; reduced-motion is driven per-frame below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, dt) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;
    m.uniforms.uReducedMotion.value = reduced ? 1 : 0;
    // Copy NDC pointer coords in-place (no allocation).
    m.uniforms.uPointer.value.set(state.pointer.x, state.pointer.y);
    m.uniforms.uPointerStrength.value = reduced ? 0 : 1;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} count={count} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} count={count} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} count={count} />
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
