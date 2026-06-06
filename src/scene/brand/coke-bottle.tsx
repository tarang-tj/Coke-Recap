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
 *
 * New in motif-rebuild:
 *   - `interior` prop (opt-in): adds animated red liquid, rising bubbles,
 *     and outside condensation droplets. Zero effect when prop is absent.
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

// Interior animation constants
const LIQUID_COLOR = '#5A0006';
const LIQUID_EMISSIVE = '#3A0004';
const BUBBLE_COLOR = '#FFFEF6';
const CONDENSATION_COLOR = '#FFFEF6';
const LIQUID_Y_MIN = 0.05;
const LIQUID_Y_MAX = 0.62; // top of belly before waist pinch
const BUBBLE_COUNT = 10;
const CONDENSATION_COUNT = 18;

// Deterministic seeded pseudo-random for condensation placement
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

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
  /** Show the trademark wordmark decal (ignored when customLabel is set). */
  showLogo?: boolean;
  /**
   * When provided, replaces the wordmark plane with a flat <Text> element
   * showing this string. Phase 03 (Tools act) uses this for chip labels.
   */
  customLabel?: string;
  /**
   * When provided, adds animated liquid fill, bubbles, and condensation
   * inside/outside the bottle. Opt-in — zero effect when absent.
   */
  interior?: BottleInteriorProps;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  /** Reduces all animations (respects prefers-reduced-motion) */
  reducedMotion?: boolean;
}

// ------- Interior sub-components -------

interface LiquidMeshProps {
  fillTarget: number;
  reducedMotion: boolean;
}

function LiquidMesh({ fillTarget, reducedMotion }: LiquidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  // Store live fill in a ref to avoid re-creating geometry
  const fillRef = useRef(fillTarget);
  fillRef.current = fillTarget;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = clock.elapsedTime;
    const swish = reducedMotion ? 0 : 0.04 * Math.sin(elapsed * 0.6);
    const liveFill = fillRef.current + swish;
    const h = Math.max(0.01, liveFill * (LIQUID_Y_MAX - LIQUID_Y_MIN));
    // Cylinder bottom at LIQUID_Y_MIN, top at LIQUID_Y_MIN + h
    mesh.position.y = LIQUID_Y_MIN + h / 2;
    mesh.scale.y = h;
  });

  return (
    <mesh ref={meshRef} position={[0, LIQUID_Y_MIN, 0]}>
      {/* height=1 cylinder; scale.y drives actual height in useFrame */}
      <cylinderGeometry args={[0.30, 0.34, 1, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color={LIQUID_COLOR}
        emissive={LIQUID_EMISSIVE}
        emissiveIntensity={0.25}
        roughness={0.3}
        metalness={0.0}
      />
    </mesh>
  );
}

interface BubblesProps {
  fillTarget: number;
  reducedMotion: boolean;
}

function Bubbles({ fillTarget, reducedMotion }: BubblesProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Each bubble: phase offset, x/z offset, rise speed
  const bubbleData = useMemo(() => {
    const rng = seededRng(42);
    return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
      phaseY: rng() * (LIQUID_Y_MAX - LIQUID_Y_MIN) + LIQUID_Y_MIN,
      x: (rng() - 0.5) * 0.46,
      z: (rng() - 0.5) * 0.46,
      speed: 0.045 + rng() * 0.045,
      phaseOffset: i * (1.0 / BUBBLE_COUNT),
    }));
  }, []);

  const positionsRef = useRef(bubbleData.map((b) => b.phaseY));

  useFrame(({ clock }, dt) => {
    const group = groupRef.current;
    if (!group) return;
    const liveFill = fillTarget;
    const surfaceY = LIQUID_Y_MIN + liveFill * (LIQUID_Y_MAX - LIQUID_Y_MIN);

    group.children.forEach((child, i) => {
      if (reducedMotion) {
        // Freeze at phase=0 position
        const b = bubbleData[i];
        child.position.set(b.x, b.phaseY, b.z);
        return;
      }
      const b = bubbleData[i];
      positionsRef.current[i] += b.speed * dt;
      const y = LIQUID_Y_MIN + ((positionsRef.current[i] - LIQUID_Y_MIN) % (surfaceY - LIQUID_Y_MIN + 0.01));
      const clampedY = y < LIQUID_Y_MIN ? LIQUID_Y_MIN + 0.01 : y;
      // Recycle if above surface
      if (clampedY > surfaceY) {
        positionsRef.current[i] = LIQUID_Y_MIN + b.phaseOffset * (surfaceY - LIQUID_Y_MIN);
      }
      child.position.set(b.x, clampedY, b.z);
      // Fade near surface
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        const proximity = Math.max(0, (surfaceY - clampedY) / 0.06);
        mat.opacity = Math.min(0.85, proximity * 0.85);
      }
    });
  });

  // Reset positions on mount
  useMemo(() => {
    positionsRef.current = bubbleData.map((b) => b.phaseY);
  }, [bubbleData]);

  return (
    <group ref={groupRef}>
      {bubbleData.map((b, i) => (
        <mesh key={i} position={[b.x, b.phaseY, b.z]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial
            color={BUBBLE_COLOR}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

interface CondensationProps {
  reducedMotion: boolean;
}

function Condensation({ reducedMotion }: CondensationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Bottle profile radius at a given y (simplified linear interpolation of key points)
  function bodyRadiusAt(y: number): number {
    // Key profile points from coke-bottle-geometry
    const pts: [number, number][] = [
      [0.26, 0.10], [0.30, 0.20], [0.345, 0.31], [0.360, 0.37],
      [0.360, 0.42], [0.355, 0.47], [0.340, 0.51], [0.310, 0.55],
      [0.270, 0.585], [0.225, 0.615], [0.210, 0.63], [0.255, 0.68],
      [0.320, 0.745], [0.290, 0.82],
    ];
    for (let i = 1; i < pts.length; i++) {
      if (y >= pts[i - 1][1] && y <= pts[i][1]) {
        const t = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] + 1e-9);
        return pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
      }
    }
    return 0.28;
  }

  const droplets = useMemo(() => {
    const rng = seededRng(99);
    return Array.from({ length: CONDENSATION_COUNT }, () => {
      const y = 0.15 + rng() * (0.95 - 0.15);
      const angle = rng() * Math.PI * 2;
      const r = bodyRadiusAt(y) + 0.005;
      return { y, angle, r };
    });
  }, []);

  // Set instance matrices once
  useMemo(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    droplets.forEach((d, i) => {
      dummy.position.set(Math.cos(d.angle) * d.r, d.y, Math.sin(d.angle) * d.r);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat || reducedMotion) return;
    // Gentle twinkle — different from any highlight lerp in parent
    mat.emissiveIntensity = 0.04 + 0.03 * Math.sin(clock.elapsedTime * 1.3 + 1.7);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONDENSATION_COUNT]}>
      <sphereGeometry args={[0.012, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={CONDENSATION_COLOR}
        emissive={CONDENSATION_COLOR}
        emissiveIntensity={0.04}
        roughness={0.05}
        metalness={0.0}
        transparent
        opacity={0.75}
      />
    </instancedMesh>
  );
}

// CondensationWithInit: needs ref to be available after mount to set matrices
function CondensationMounted({ reducedMotion }: CondensationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const initialized = useRef(false);

  function bodyRadiusAt(y: number): number {
    const pts: [number, number][] = [
      [0.26, 0.10], [0.30, 0.20], [0.345, 0.31], [0.360, 0.37],
      [0.360, 0.42], [0.355, 0.47], [0.340, 0.51], [0.310, 0.55],
      [0.270, 0.585], [0.225, 0.615], [0.210, 0.63], [0.255, 0.68],
      [0.320, 0.745], [0.290, 0.82],
    ];
    for (let i = 1; i < pts.length; i++) {
      if (y >= pts[i - 1][1] && y <= pts[i][1]) {
        const t = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] + 1e-9);
        return pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
      }
    }
    return 0.28;
  }

  const droplets = useMemo(() => {
    const rng = seededRng(99);
    return Array.from({ length: CONDENSATION_COUNT }, () => {
      const y = 0.15 + rng() * (0.95 - 0.15);
      const angle = rng() * Math.PI * 2;
      const r = bodyRadiusAt(y) + 0.005;
      return { y, angle, r };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    // Init instance matrices on first frame when refs are available
    if (!initialized.current) {
      const dummy = new THREE.Object3D();
      droplets.forEach((d, i) => {
        dummy.position.set(Math.cos(d.angle) * d.r, d.y, Math.sin(d.angle) * d.r);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    if (!reducedMotion) {
      mat.emissiveIntensity = 0.04 + 0.03 * Math.sin(clock.elapsedTime * 1.3 + 1.7);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONDENSATION_COUNT]}>
      <sphereGeometry args={[0.012, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={CONDENSATION_COLOR}
        emissive={CONDENSATION_COLOR}
        emissiveIntensity={0.04}
        roughness={0.05}
        metalness={0.0}
        transparent
        opacity={0.75}
      />
    </instancedMesh>
  );
}

// Suppress unused warning — Condensation component kept as reference, using CondensationMounted
void Condensation;

export function CokeBottle({
  scale = 1,
  lift = 0,
  highlight = 0,
  showLogo = true,
  customLabel,
  interior,
  onPointerOver,
  onPointerOut,
  onClick,
  reducedMotion = false,
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

  const fillLevel = interior?.fill ?? 0.7;

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, lift, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Interior animation — rendered before glass so liquid shows through opacity */}
      {interior && (
        <>
          <LiquidMesh fillTarget={fillLevel} reducedMotion={reducedMotion} />
          {interior.bubbles && (
            <Bubbles fillTarget={fillLevel} reducedMotion={reducedMotion} />
          )}
          {interior.condensation && (
            <CondensationMounted reducedMotion={reducedMotion} />
          )}
        </>
      )}

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
