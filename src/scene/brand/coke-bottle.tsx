/**
 * CokeBottle — authentic contour-bottle 3-D asset.
 * Glass body, hobble-skirt flutes, red label band, Coca-Cola wordmark, metal cap.
 *
 * New in polish-pass-3:
 *   - Silhouette rewritten to match 1915 hobble-skirt patent (4.2:1 H:D ratio)
 *   - Box-stamp flutes replaced with subtle curved vertical ribbing
 *   - All decoration y-positions adjusted to fit the new profile
 *   - `customLabel` prop: when provided, swaps the wordmark plane for a <Text>
 *     element showing that string (used by act-tools chip-labeled bottles)
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useLogoTexture } from '../../hooks/use-logo-texture';
import { buildBottleGeometrySet } from './coke-bottle-geometry';

const GLASS_COLOR = '#8B0008';
const GLASS_EMISSIVE = '#3A0004';
const CAP_COLOR = '#C8C4BC';
const LABEL_RED = '#F40009';

// New profile belly sits at r ≈ 0.36, y ≈ 0.37–0.47
// Label band center ≈ y 0.46 (within belly), radius matches belly surface
const LABEL_Y = 0.46;
const LABEL_R = 0.362; // just proud of the glass belly surface (r=0.360)
const LABEL_H = 0.26;  // label height covers y ≈ 0.33 → 0.59

// Wordmark plane sits at front face of label cylinder
const LOGO_Y = 0.48;
const LOGO_Z = 0.368; // r + tiny offset so it renders over label

// Microstrip sits below logo, near lower belly / waist transition
const STRIP_Y = 0.35;
const STRIP_Z = 0.355;

export interface CokeBottleProps {
  /** Uniform scale applied to the whole bottle (height ≈ 1.0 at scale 1). */
  scale?: number;
  /** Vertical lift for hover animations (parent can also move the group). */
  lift?: number;
  /** 0–1 driven by hover / selection for emissive brighten. */
  highlight?: number;
  /** Show the trademark wordmark decal (ignored when customLabel is set). */
  showLogo?: boolean;
  /**
   * When provided, replaces the wordmark plane with a flat <Text> element
   * showing this string. Phase 03 (Tools act) uses this for chip labels.
   */
  customLabel?: string;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export function CokeBottle({
  scale = 1,
  lift = 0,
  highlight = 0,
  showLogo = true,
  customLabel,
  onPointerOver,
  onPointerOut,
  onClick,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const logoTex = useLogoTexture('#FFFEF6');

  const { bodyGeo, flutesGeo } = useMemo(() => {
    const set = buildBottleGeometrySet(64);
    return { bodyGeo: set.body, flutesGeo: set.flutes };
  }, []);

  const hRef = useRef(highlight);
  hRef.current = highlight;

  useFrame((_, dt) => {
    const m = glassMatRef.current;
    if (!m) return;
    const target = 0.15 + hRef.current * 0.45;
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8);
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, lift, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Glass contour body — clearcoat (no transmission: perf rule) */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={glassMatRef}
          color={GLASS_COLOR}
          emissive={GLASS_EMISSIVE}
          emissiveIntensity={0.15}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hobble-skirt vertical ribs — subtle curved ridges in the lower body */}
      <mesh geometry={flutesGeo}>
        <meshPhysicalMaterial
          color="#A01012"
          roughness={0.18}
          metalness={0.08}
          clearcoat={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Red paper label — flush with the new belly geometry */}
      <mesh position={[0, LABEL_Y, 0]}>
        <cylinderGeometry args={[LABEL_R, LABEL_R, LABEL_H, 64, 1, true]} />
        <meshStandardMaterial
          color={LABEL_RED}
          roughness={0.55}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Trademark wordmark OR custom chip label on the label belly */}
      {customLabel ? (
        <Text
          position={[0, LOGO_Y, LOGO_Z]}
          fontSize={0.085}
          color="#FFFEF6"
          outlineWidth={0.012}
          outlineColor="#0A0203"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.32}
        >
          {customLabel}
        </Text>
      ) : (
        showLogo && (
          <mesh position={[0, LOGO_Y, LOGO_Z]}>
            <planeGeometry args={[0.34, 0.1]} />
            <meshBasicMaterial
              map={logoTex}
              transparent
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        )
      )}

      {/* "ORIGINAL TASTE" micro-strip below logo */}
      <mesh position={[0, STRIP_Y, STRIP_Z]}>
        <planeGeometry args={[0.2, 0.025]} />
        <meshBasicMaterial color="#FFFEF6" transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Neck ring — sits at collar swell y ≈ 1.31 in new profile */}
      <mesh position={[0, 1.31, 0]}>
        <torusGeometry args={[0.152, 0.010, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Metal screw cap — top of bottle y ≈ 1.47–1.55 */}
      <mesh position={[0, 1.485, 0]}>
        <cylinderGeometry args={[0.163, 0.163, 0.075, 24]} />
        <meshStandardMaterial color={CAP_COLOR} roughness={0.35} metalness={0.75} />
      </mesh>
      {/* Cap top disc */}
      <mesh position={[0, 1.525, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.163, 0.163, 0.012, 24]} />
        <meshStandardMaterial color="#B0ACA4" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Base punt ring — foot ring at y ≈ 0.03, radius matches new base flare */}
      <mesh position={[0, 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.255, 0.016, 8, 32]} />
        <meshStandardMaterial color="#5A0006" roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  );
}
