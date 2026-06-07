/**
 * CokeBottle — authentic contour-bottle 3-D asset.
 *
 * Phase B (proportion fix + dark liquid + glass tint):
 *   - Belly peak moved from y=0.44 → y=0.62 (40% from base, less elongated above)
 *   - Near-black liquid (#0A0503) — real Coke reads dark through bottle glass
 *   - Faint green-blue glass tint (#D0DDD2, opacity 0.22)
 *   - Meniscus disc moved to y=0.96 (matches new liquid top)
 *   - Upper-neck wordmark at y=1.20 (mid-neck cylinder)
 *   - Neck ring torus at y=1.39 (new collar position)
 *   - Crown cap with 21 crimped flutes + wordmark stamp (unchanged)
 *   - `interior` prop kept for API compat but liquid always renders (no-op)
 *   - `highlight` prop drives liquid emissiveIntensity (0.05 → 0.18)
 *
 * Props interface unchanged — all consumers depend on these exact names:
 *   scale, lift, highlight, showLogo, customLabel, interior, reducedMotion,
 *   onPointerOver, onPointerOut, onClick
 */
import { useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useLogoTexture } from '../../hooks/use-logo-texture';
import { buildBottleGeometrySet, buildLiquidGeometry, profileRadiusAt, buildContourProfile } from './coke-bottle-geometry';

// ---- Material color constants ----

// Phase B: faint green-blue glass tint (real Coke bottle glass), opacity bumped to 0.22
const GLASS_COLOR = '#D0DDD2';        // faint green-blue tint
const GLASS_RIB_COLOR = '#DCE8DC';    // slightly lighter for highlight ridge effect

// Liquid constants — near-black (real Coke reads dark through bottle glass)
const LIQUID_COLOR = '#0A0503';       // very dark, near-black
const LIQUID_EMISSIVE = '#1A0D05';    // very subtle warm interior glow
const LIQUID_EMISSIVE_BASE = 0.05;    // base emissive intensity (much darker than before)
const LIQUID_EMISSIVE_HIGHLIGHT = 0.18; // emissive on highlight=1

// Meniscus (liquid surface highlight) — moved down to match new yEnd=0.96
const MENISCUS_Y = 0.96;              // matches new liquid top (yEnd in buildLiquidGeometry)
// MENISCUS_R derived from profileRadiusAt(profile, 0.96) - 0.012 inset → ~0.143
// (computed at runtime below using the profile helper)

// Crown cap geometry constants
const CRIMP_COUNT = 21;
const CAP_Y = 1.500;                  // positioned at bottle top

// ---- Public props interface (UNCHANGED — all consumers depend on these) ----

export interface BottleInteriorProps {
  /** 0–1 fill level; 0 = empty, 1 = full to the shoulder */
  fill?: number;
  /** Show rising carbonation bubbles inside the liquid */
  bubbles?: boolean;
  /** Show condensation droplets on the outside of the glass */
  condensation?: boolean;
}

export interface CokeBottleProps {
  /** Uniform scale applied to the whole bottle (height ≈ 1.0 at scale 1). */
  scale?: number;
  /** Vertical lift for hover animations (parent can also move the group). */
  lift?: number;
  /** 0–1 driven by hover / selection for emissive brighten. */
  highlight?: number;
  /** Show the trademark wordmark on the crown cap stamp. */
  showLogo?: boolean;
  /**
   * When provided, replaces the upper-neck embossed wordmark with this string.
   * (Was: label plane text. Now: neck emboss text.)
   */
  customLabel?: string;
  /**
   * KEPT FOR API COMPAT — liquid is always rendered now (no-op).
   * Previously opted into animated liquid fill / bubbles / condensation.
   */
  interior?: BottleInteriorProps;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  /** Reduces all animations (respects prefers-reduced-motion) */
  reducedMotion?: boolean;
}

// ------- Crown cap with 21 crimped flutes -------

function CrownCrimps({
  logoTex,
  showLogo,
}: {
  logoTex: THREE.CanvasTexture;
  showLogo: boolean;
}) {
  const crimpRef = useRef<THREE.InstancedMesh>(null);

  const crimpMatrices = useMemo(() => {
    const helper = new THREE.Object3D();
    // Crimp ring radius scaled to fit the slimmer neck top (r=0.102 at top rim)
    const crimpRingR = 0.113;
    return Array.from({ length: CRIMP_COUNT }, (_, i) => {
      const angle = (i / CRIMP_COUNT) * Math.PI * 2;
      helper.position.set(
        Math.cos(angle) * crimpRingR,
        0,
        Math.sin(angle) * crimpRingR,
      );
      helper.rotation.set(0, -angle, 0);
      helper.updateMatrix();
      return helper.matrix.clone();
    });
  }, []);

  useLayoutEffect(() => {
    const mesh = crimpRef.current;
    if (!mesh) return;
    crimpMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [crimpMatrices]);

  return (
    <group position={[0, CAP_Y, 0]}>
      {/* Cap body — thin red disc with slight taper (crown cap shape), sized for slimmer neck */}
      <mesh>
        <cylinderGeometry args={[0.105, 0.115, 0.035, 28]} />
        <meshPhysicalMaterial
          color="#F40009"
          roughness={0.35}
          metalness={0.25}
          clearcoat={0.6}
          clearcoatRoughness={0.18}
        />
      </mesh>

      {/* Top wordmark stamp — cream logo on top face */}
      {showLogo && (
        <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.13, 0.05]} />
          <meshBasicMaterial
            map={logoTex}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 21 crimped flutes around the rim */}
      <instancedMesh
        ref={crimpRef}
        args={[undefined, undefined, CRIMP_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.014, 0.040, 0.012]} />
        <meshStandardMaterial color="#A60010" roughness={0.4} metalness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ------- Main CokeBottle component -------

export function CokeBottle({
  scale = 1,
  lift = 0,
  highlight = 0,
  showLogo = true,
  customLabel,
  interior: _interior, // no-op: kept for API compat, liquid always renders
  onPointerOver,
  onPointerOut,
  onClick,
  reducedMotion = false,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Cream wordmark texture for the crown cap stamp
  const logoTex = useLogoTexture('#FFFEF6');

  const { bodyGeo, flutesGeo } = useMemo(() => {
    const set = buildBottleGeometrySet(96);
    return { bodyGeo: set.body, flutesGeo: set.flutes };
  }, []);

  const liquidGeo = useMemo(() => buildLiquidGeometry(), []);

  // Dispose all manually-allocated geometries on unmount
  useEffect(
    () => () => {
      bodyGeo.dispose();
      flutesGeo.dispose();
      liquidGeo.dispose();
    },
    [bodyGeo, flutesGeo, liquidGeo],
  );

  // highlight prop drives the LIQUID's emissiveIntensity (glass has no emissive)
  const hRef = useRef(highlight);
  hRef.current = highlight;

  useFrame((_, dt) => {
    const m = liquidMatRef.current;
    if (!m) return;
    const target = LIQUID_EMISSIVE_BASE + hRef.current * (LIQUID_EMISSIVE_HIGHLIGHT - LIQUID_EMISSIVE_BASE);
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8);
  });

  // Profile used for all decoration position lookups
  const profile = useMemo(() => buildContourProfile(), []);

  // Upper-neck embossed wordmark — mid-neck cylinder at y=1.20
  const neckEmbossZ = profileRadiusAt(profile, 1.20) + 0.005;

  // Meniscus disc radius — profile radius at new yEnd=0.96, inset 0.012
  const meniscusR = profileRadiusAt(profile, MENISCUS_Y) - 0.012;

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, lift, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Caramel cola liquid — always rendered, visible through clear glass */}
      <mesh geometry={liquidGeo}>
        <meshStandardMaterial
          ref={liquidMatRef}
          color={LIQUID_COLOR}
          roughness={0.45}
          metalness={0}
          emissive={LIQUID_EMISSIVE}
          emissiveIntensity={LIQUID_EMISSIVE_BASE}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Meniscus highlight — thin disc at liquid top surface (y=0.96) */}
      <mesh position={[0, MENISCUS_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[meniscusR, 24]} />
        <meshStandardMaterial
          color="#7A4519"
          emissive="#5A2F12"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Clear glass contour body — clearcoat, no transmission (perf rule) */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={GLASS_COLOR}
          roughness={0.05}
          metalness={0.0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Hobble-skirt vertical ribs — lighter near-clear for highlight ridge */}
      <mesh geometry={flutesGeo}>
        <meshPhysicalMaterial
          color={GLASS_RIB_COLOR}
          roughness={0.10}
          metalness={0.0}
          clearcoat={0.8}
          clearcoatRoughness={0.04}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      {/* Upper-neck embossed wordmark — like real Coke bottles, subtle glass-color */}
      {customLabel ? (
        <Text
          position={[0, 1.20, neckEmbossZ]}
          fontSize={0.055}
          color="#E8EAE8"
          outlineWidth={0.003}
          outlineColor="#B0B4B0"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.35}
          letterSpacing={0.03}
          renderOrder={1}
        >
          {customLabel}
        </Text>
      ) : (
        <Text
          position={[0, 1.20, neckEmbossZ]}
          fontSize={0.055}
          color="#E8EAE8"
          outlineWidth={0.003}
          outlineColor="#B0B4B0"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.35}
          letterSpacing={0.03}
          renderOrder={1}
        >
          Coca-Cola
        </Text>
      )}

      {/* Neck ring — collar swell at y ≈ 1.39 per new profile (Phase B) */}
      <mesh position={[0, 1.390, 0]}>
        <torusGeometry args={[0.140, 0.007, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Crown cap — resized for slimmer neck (r=0.102 at top rim) */}
      <CrownCrimps logoTex={logoTex} showLogo={showLogo} />

      {/* Base punt ring — foot ring at y ≈ 0.028, radius matches new foot ring ~0.20 */}
      <mesh position={[0, 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.195, 0.012, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Dimpled-bottom embossed base ring — mid-punt level */}
      <mesh position={[0, 0.050, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.140, 0.004, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.35} metalness={0.12} />
      </mesh>
    </group>
  );
}
