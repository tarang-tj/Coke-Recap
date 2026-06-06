import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Act 1 — Role: chrome magnifying lens orbiting a wireframe globe.
// Visual concept: "Global Human Insights" — globe = global, lens = insight.
// No transmission materials (perf rule). Clearcoat + emissive approximation only.

const CREAM = '#F1E9DA';
const COKE_RED = '#F40009';
const CHROME = '#C8C4BC';
const GLOBE_DARK = '#2A0006';
const LENS_GLASS_COLOR = '#5A0008';
const LENS_GLASS_EMISSIVE = '#400006';

// Orbit params
const ORBIT_RADIUS = 1.6;
const ORBIT_SPEED_NORMAL = 0.22;
const ORBIT_SPEED_HOVER = 0.55;

// Fixed reduced-motion lens pose (angle = 0.8 rad gives a pleasing upper-right position)
const REDUCED_ANGLE = 0.8;

// Landmass patch positions: [theta (polar), phi (azimuth)] pairs on a unit sphere
const LANDMASS_PATCHES: Array<[number, number]> = [
  [0.9, 1.1],
  [1.2, 3.2],
  [0.6, 4.8],
  [1.5, 0.5],
  [0.4, 2.4],
  [1.8, 5.5],
];

export function ActRole() {
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<THREE.Group>(null);
  const lensGroupRef = useRef<THREE.Group>(null);
  const lensGlassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const lensSpotRef = useRef<THREE.PointLight>(null);
  const hoveredRef = useRef<boolean>(false);
  const angleRef = useRef<number>(REDUCED_ANGLE);

  // Pre-compute landmass patch world positions (outward offset from unit sphere)
  const landmassPositions = useMemo<Array<[number, number, number]>>(
    () =>
      LANDMASS_PATCHES.map(([theta, phi]) => {
        const r = 1.04; // slightly outside sphere surface
        return [
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.cos(theta),
          r * Math.sin(theta) * Math.sin(phi),
        ];
      }),
    [],
  );

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const envelope = mixesRef.current.role;
    const active = envelope > 0.002;

    g.visible = active;

    if (!active) {
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }

    // Entrance: dive in from z=1.5, scale up
    g.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    g.scale.setScalar(0.5 + 0.5 * envelope);

    const isHovered = hoveredRef.current;
    const orbitSpeed = isHovered ? ORBIT_SPEED_HOVER : ORBIT_SPEED_NORMAL;

    if (!reduced) {
      angleRef.current += dt * orbitSpeed;
    }

    const angle = reduced ? REDUCED_ANGLE : angleRef.current;

    // Globe slow rotation
    const globe = globeRef.current;
    if (globe && !reduced) {
      globe.rotation.y += dt * 0.18;
    }

    // Lens position: elliptical orbit dipping above/below equator
    const lensGroup = lensGroupRef.current;
    if (lensGroup) {
      lensGroup.position.set(
        Math.cos(angle) * ORBIT_RADIUS,
        Math.sin(angle * 0.7) * 0.4,
        Math.sin(angle) * ORBIT_RADIUS,
      );
      // Always face globe center
      lensGroup.lookAt(0, 0, 0);
    }

    // Lens spotlight tracks lens position
    const spot = lensSpotRef.current;
    if (spot && lensGroup) {
      spot.position.copy(lensGroup.position);
    }

    // Glass emissive: brightens on hover
    const mat = lensGlassMatRef.current;
    if (mat) {
      const targetEmissive = isHovered ? 0.85 * envelope : 0.4 * envelope;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Key lights */}
      <pointLight position={[2, 3, 2]} intensity={3.0} color={CREAM} />
      <pointLight position={[-2, -1, 2]} intensity={1.5} color={COKE_RED} />
      {/* Lens spotlight — tracks lens position each frame, gives red "examining" glow */}
      <pointLight
        ref={lensSpotRef}
        intensity={0.8}
        color={COKE_RED}
        distance={2.5}
      />

      {/* Globe assembly */}
      <group ref={globeRef}>
        {/* Solid dark fill — prevents back-side wireframe bleed-through */}
        <mesh scale={0.98} frustumCulled={false}>
          <sphereGeometry args={[1.0, 24, 16]} />
          <meshStandardMaterial color={GLOBE_DARK} roughness={0.6} />
        </mesh>

        {/* Wireframe overlay */}
        <mesh frustumCulled={false}>
          <icosahedronGeometry args={[1.0, 4]} />
          <meshBasicMaterial
            color={CREAM}
            wireframe={true}
            transparent={true}
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>

        {/* Landmass patches — subtle cream dots hinting at continents */}
        {landmassPositions.map((pos, i) => (
          <mesh key={i} position={pos} frustumCulled={false}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial
              color={CREAM}
              transparent={true}
              opacity={0.28}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Magnifying lens — orbits the globe */}
      <group
        ref={lensGroupRef}
        scale={0.85}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
          document.body.style.cursor = '';
        }}
      >
        {/* Chrome bezel / rim */}
        <mesh frustumCulled={false}>
          <torusGeometry args={[0.55, 0.06, 12, 36]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Chrome handle — short horizontal cylinder off the lower rim */}
        <mesh
          position={[0, -0.72, 0]}
          rotation={[0, 0, Math.PI / 2]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.85, 16]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Optical glass disc — red tint, clearcoat approximation, no transmission */}
        <mesh frustumCulled={false}>
          <cylinderGeometry args={[0.50, 0.50, 0.04, 36]} />
          <meshPhysicalMaterial
            ref={lensGlassMatRef}
            color={LENS_GLASS_COLOR}
            emissive={LENS_GLASS_EMISSIVE}
            emissiveIntensity={0.4}
            roughness={0.1}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent={true}
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
