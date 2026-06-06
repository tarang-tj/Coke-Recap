/**
 * CokeBottle — authentic contour-bottle 3-D asset.
 * Glass body, hobble-skirt flutes, red label band, Coca-Cola wordmark, metal cap.
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useLogoTexture } from '../../hooks/use-logo-texture';
import { buildBottleGeometrySet } from './coke-bottle-geometry';

const GLASS_COLOR = '#8B0008';
const GLASS_EMISSIVE = '#3A0004';
const CAP_COLOR = '#C8C4BC';
const LABEL_RED = '#F40009';

export interface CokeBottleProps {
  /** Uniform scale applied to the whole bottle (height ≈ 1.0 at scale 1). */
  scale?: number;
  /** Vertical lift for hover animations (parent can also move the group). */
  lift?: number;
  /** 0–1 driven by hover / selection for emissive brighten. */
  highlight?: number;
  /** Show the trademark wordmark decal. */
  showLogo?: boolean;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export function CokeBottle({
  scale = 1,
  lift = 0,
  highlight = 0,
  showLogo = true,
  onPointerOver,
  onPointerOut,
  onClick,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const logoTex = useLogoTexture('#FFFEF6');

  const { bodyGeo, flutesGeo } = useMemo(() => {
    const set = buildBottleGeometrySet(48);
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
      {/* Glass contour body */}
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

      {/* Hobble-skirt vertical flutes — slightly lighter glass ridges */}
      <mesh geometry={flutesGeo}>
        <meshPhysicalMaterial
          color="#A01012"
          roughness={0.18}
          metalness={0.08}
          clearcoat={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Red paper label — thin curved strip on the belly */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.455, 0.455, 0.22, 48, 1, true]} />
        <meshStandardMaterial
          color={LABEL_RED}
          roughness={0.55}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Trademark wordmark on the label belly */}
      {showLogo && (
        <mesh position={[0, 0.53, 0.46]}>
          <planeGeometry args={[0.34, 0.1]} />
          <meshBasicMaterial map={logoTex} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}

      {/* "ORIGINAL TASTE" micro-strip below logo */}
      <mesh position={[0, 0.40, 0.43]}>
        <planeGeometry args={[0.2, 0.025]} />
        <meshBasicMaterial color="#FFFEF6" transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Neck ring */}
      <mesh position={[0, 1.36, 0]}>
        <torusGeometry args={[0.155, 0.01, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Metal screw cap */}
      <mesh position={[0, 1.50, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.07, 24]} />
        <meshStandardMaterial color={CAP_COLOR} roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh position={[0, 1.54, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.01, 24]} />
        <meshStandardMaterial color="#B0ACA4" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Base punt ring */}
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.018, 8, 32]} />
        <meshStandardMaterial color="#5A0006" roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  );
}
