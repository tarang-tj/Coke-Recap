import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Coca-Cola "Dynamic Ribbon" — glossy white swoosh tube along a CatmullRomCurve3.
// Geometry is static (built in useMemo); the group oscillates gently in useFrame
// so bloom catches the emissive edge with a living, breathing feel.

export interface DynamicRibbonProps {
  /** Uniform scale applied to the ribbon group. Default 1. */
  scale?: number;
  /** Base color of the ribbon. Default '#FFFEF6' (off-white). */
  color?: string;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Material opacity. Default 0.95. */
  opacity?: number;
  /** Optional world-space position for the wrapping group. */
  position?: [number, number, number];
  /** Optional Euler rotation (radians) for the wrapping group. */
  rotation?: [number, number, number];
}

// Characteristic Coca-Cola swoosh: rises from left, arcs high mid-right, sweeps
// back down. The z offsets give a subtle 3-D depth so bloom hits the edge.
function buildRibbonCurve(): THREE.CatmullRomCurve3 {
  const pts = [
    new THREE.Vector3(-2.6, -0.55, 0.0),
    new THREE.Vector3(-1.9, 0.05,  0.12),
    new THREE.Vector3(-0.9, 0.55,  -0.06),
    new THREE.Vector3( 0.0, 0.72,  0.0),
    new THREE.Vector3( 0.9, 0.60,  0.10),
    new THREE.Vector3( 1.7, 0.18,  -0.06),
    new THREE.Vector3( 2.3, -0.20, 0.0),
    new THREE.Vector3( 2.8, -0.48, 0.08),
  ];
  // tension 0.5 → smooth catmull-rom, not clamped
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

export function DynamicRibbon({
  scale = 1,
  color = '#FFFEF6',
  speed = 1,
  opacity = 0.95,
  position,
  rotation,
}: DynamicRibbonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  // Static geometry — tube radius 0.055 so it reads as a thick ribbon
  const geometry = useMemo(() => {
    const curve = buildRibbonCurve();
    return new THREE.TubeGeometry(curve, 64, 0.055, 8, false);
  }, []);

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g || reduced) return;
    const t = clock.elapsedTime * speed;
    // Gentle breathing: subtle vertical float + roll so Bloom edge shifts
    g.position.y = (position?.[1] ?? 0) + 0.07 * Math.sin(t * 0.55);
    g.rotation.z = 0.025 * Math.sin(t * 0.35);
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={position}
      rotation={rotation}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={0.55}
          roughness={0.12}
          metalness={0.08}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
