import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import liquidVert from '../shaders/liquid.vert.glsl?raw';
import liquidFrag from '../shaders/liquid.frag.glsl?raw';
import { useScrollRef } from './scroll-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { Bubbles } from './bubbles';

// Large back-facing sphere centered on the world origin. Camera lives
// inside it; the shader paints the inner walls with a viscous-looking
// Coke-red noise field.
//
// We keep the sphere stationary in world space (radius 30) rather than
// following the camera — this lets the parallax of the noise field read
// as "we're moving through liquid" rather than "the liquid wraps us".

const BRIGHT = new THREE.Color('#F40009');
const DEEP = new THREE.Color('#3A0204');
const AMBER = new THREE.Color('#A06A00');

export function FluidEnvironment() {
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReducedMotion: { value: reduced ? 1 : 0 },
      uActT: { value: 0 },
      uColorBright: { value: BRIGHT },
      uColorDeep: { value: DEEP },
      uColorAmber: { value: AMBER },
    }),
    [reduced],
  );

  useFrame((_, dt) => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;
    m.uniforms.uActT.value = scrollRef.current;
    m.uniforms.uReducedMotion.value = reduced ? 1 : 0;
  });

  return (
    <>
      <mesh>
        {/* Large inverted sphere — camera inside. */}
        <sphereGeometry args={[30, 64, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={liquidVert}
          fragmentShader={liquidFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <Bubbles />
    </>
  );
}
