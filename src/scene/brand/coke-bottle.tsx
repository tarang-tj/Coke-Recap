/**
 * CokeBottle — authentic contour-bottle 3-D asset.
 *
 * Phase B (bottle-authenticity rebuild):
 *   - Georgia-green glass (#2F4D2A) replacing the old red glass
 *   - Bigger red label band (height 0.42, was 0.26)
 *   - Larger readable wordmark plane (0.62 × 0.18, was 0.34 × 0.10)
 *   - Crown cap with 21 crimped flutes replacing the screw cap
 *   - Smoother silhouette (96 lathe segments, ~70 profile points)
 *   - Interior liquid color #5A0006 (deep Coke red) unchanged
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
import { buildBottleGeometrySet } from './coke-bottle-geometry';

// ---- Material color constants ----

// Phase B: Georgia-green glass (historic Coca-Cola contour bottle)
const GLASS_COLOR = '#2F4D2A';        // historic Georgia green glass
const GLASS_EMISSIVE = '#1A2D14';     // subtle green inner glow
const GLASS_RIB_COLOR = '#3D6035';    // slightly lighter green for highlight ridge effect

// Label
const LABEL_RED = '#F40009';          // classic Coca-Cola red (unchanged)
const LABEL_EMISSIVE_RED = '#A60010'; // low-intensity label presence under low light

// ---- Phase B label geometry — bigger, bolder ----
// New belly peak is at y ≈ 0.44, r ≈ 0.355.
// Label centered at y=0.42 covers y ≈ 0.21 → 0.63 (height 0.42).
const LABEL_Y = 0.42;
const LABEL_R = 0.358; // just proud of belly surface (r=0.355) + thin offset
const LABEL_H = 0.42;  // taller label band — 60% bigger than old 0.26

// Wordmark and custom-label position — front of label band
const WORDMARK_Y = LABEL_Y + 0.02;
const WORDMARK_Z = LABEL_R + 0.008; // proud of label surface

// Micro-strip below wordmark
const STRIP_Y = LABEL_Y - 0.14;
const STRIP_Z = WORDMARK_Z;

// Interior animation constants (unchanged)
const LIQUID_COLOR = '#5A0006';
const LIQUID_EMISSIVE = '#3A0004';
const BUBBLE_COLOR = '#FFFEF6';
const CONDENSATION_COLOR = '#FFFEF6';
const LIQUID_Y_MIN = 0.05;
const LIQUID_Y_MAX = 0.62;
const BUBBLE_COUNT = 10;
const CONDENSATION_COUNT = 18;

// Crown cap geometry constants
const CRIMP_COUNT = 21;

// Deterministic seeded pseudo-random for condensation placement
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

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

// ------- Interior sub-components (unchanged behavior) -------

interface LiquidMeshProps {
  fillTarget: number;
  reducedMotion: boolean;
}

function LiquidMesh({ fillTarget, reducedMotion }: LiquidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef(fillTarget);
  fillRef.current = fillTarget;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = clock.elapsedTime;
    const swish = reducedMotion ? 0 : 0.04 * Math.sin(elapsed * 0.6);
    const liveFill = fillRef.current + swish;
    const h = Math.max(0.01, liveFill * (LIQUID_Y_MAX - LIQUID_Y_MIN));
    mesh.position.y = LIQUID_Y_MIN + h / 2;
    mesh.scale.y = h;
  });

  return (
    <mesh ref={meshRef} position={[0, LIQUID_Y_MIN, 0]}>
      {/* height=1 cylinder; scale.y drives actual height in useFrame */}
      <cylinderGeometry args={[0.30, 0.34, 1, 24]} />
      <meshStandardMaterial
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

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;
    const liveFill = fillTarget;
    const surfaceY = LIQUID_Y_MIN + liveFill * (LIQUID_Y_MAX - LIQUID_Y_MIN);

    group.children.forEach((child, i) => {
      if (reducedMotion) {
        const b = bubbleData[i];
        child.position.set(b.x, b.phaseY, b.z);
        return;
      }
      const b = bubbleData[i];
      positionsRef.current[i] += b.speed * dt;
      const y = LIQUID_Y_MIN + ((positionsRef.current[i] - LIQUID_Y_MIN) % (surfaceY - LIQUID_Y_MIN + 0.01));
      const clampedY = y < LIQUID_Y_MIN ? LIQUID_Y_MIN + 0.01 : y;
      if (clampedY > surfaceY) {
        positionsRef.current[i] = LIQUID_Y_MIN + b.phaseOffset * (surfaceY - LIQUID_Y_MIN);
      }
      child.position.set(b.x, clampedY, b.z);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        const proximity = Math.max(0, (surfaceY - clampedY) / 0.06);
        mat.opacity = Math.min(0.85, proximity * 0.85);
      }
    });
  });

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

// Profile radius lookup for condensation droplet placement (matches new geometry)
function bodyRadiusAt(y: number): number {
  const pts: [number, number][] = [
    [0.258, 0.075], [0.288, 0.158], [0.336, 0.278], [0.355, 0.420],
    [0.349, 0.475], [0.310, 0.547], [0.205, 0.630], [0.262, 0.686],
    [0.332, 0.770], [0.308, 0.808], [0.243, 0.852], [0.165, 0.925],
  ];
  for (let i = 1; i < pts.length; i++) {
    if (y >= pts[i - 1][1] && y <= pts[i][1]) {
      const t = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] + 1e-9);
      return pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
    }
  }
  return 0.28;
}

function CondensationMounted({ reducedMotion }: CondensationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const initialized = useRef(false);

  const droplets = useMemo(() => {
    const rng = seededRng(99);
    return Array.from({ length: CONDENSATION_COUNT }, () => {
      const y = 0.15 + rng() * (0.95 - 0.15);
      const angle = rng() * Math.PI * 2;
      const r = bodyRadiusAt(y) + 0.005;
      return { y, angle, r };
    });
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

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

// ------- Crown cap with 21 crimped flutes -------

/**
 * CrownCrimps — 21 small wedge/box instances arranged radially around the
 * crown cap rim. Uses instancedMesh (same pattern as act-role flute instancing)
 * but sized for the bottle cap rim.
 */
function CrownCrimps({ logoTex }: { logoTex: THREE.CanvasTexture }) {
  const crimpRef = useRef<THREE.InstancedMesh>(null);

  const crimpMatrices = useMemo(() => {
    const helper = new THREE.Object3D();
    return Array.from({ length: CRIMP_COUNT }, (_, i) => {
      const angle = (i / CRIMP_COUNT) * Math.PI * 2;
      helper.position.set(
        Math.cos(angle) * 0.163,
        0,
        Math.sin(angle) * 0.163,
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
    <group position={[0, 1.500, 0]}>
      {/* Cap body — thin red disc with slight taper (crown cap shape) */}
      <mesh>
        <cylinderGeometry args={[0.158, 0.165, 0.035, 28]} />
        <meshPhysicalMaterial
          color={LABEL_RED}
          roughness={0.35}
          metalness={0.25}
          clearcoat={0.6}
          clearcoatRoughness={0.18}
        />
      </mesh>

      {/* Top wordmark stamp — small cream logo on top face */}
      <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.07]} />
        <meshBasicMaterial
          map={logoTex}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* 21 crimped flutes around the rim */}
      <instancedMesh
        ref={crimpRef}
        args={[undefined, undefined, CRIMP_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.018, 0.040, 0.015]} />
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
  interior,
  onPointerOver,
  onPointerOut,
  onClick,
  reducedMotion = false,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  // Cream wordmark texture — used on both label and crown cap top stamp
  const logoTex = useLogoTexture('#FFFEF6');

  const { bodyGeo, flutesGeo } = useMemo(() => {
    // Phase B: default segments now 96 (set in buildBottleGeometrySet signature)
    const set = buildBottleGeometrySet(96);
    return { bodyGeo: set.body, flutesGeo: set.flutes };
  }, []);

  // Dispose manually-allocated lathe + rib geometries on unmount
  useEffect(
    () => () => {
      bodyGeo.dispose();
      flutesGeo.dispose();
    },
    [bodyGeo, flutesGeo],
  );

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

      {/* Georgia-green glass contour body — clearcoat (no transmission: perf rule) */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={glassMatRef}
          color={GLASS_COLOR}
          emissive={GLASS_EMISSIVE}
          emissiveIntensity={0.15}
          roughness={0.10}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.06}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hobble-skirt vertical ribs — lighter green for highlight ridge effect */}
      <mesh geometry={flutesGeo}>
        <meshPhysicalMaterial
          color={GLASS_RIB_COLOR}
          roughness={0.18}
          metalness={0.08}
          clearcoat={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Red paper label — bigger and bolder (height 0.42, was 0.26) */}
      <mesh position={[0, LABEL_Y, 0]}>
        <cylinderGeometry args={[LABEL_R, LABEL_R, LABEL_H, 64, 1, true]} />
        <meshStandardMaterial
          color={LABEL_RED}
          emissive={LABEL_EMISSIVE_RED}
          emissiveIntensity={0.2}
          roughness={0.55}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Wordmark OR custom chip label — ~1.8× bigger than before */}
      {customLabel ? (
        <Text
          position={[0, WORDMARK_Y, WORDMARK_Z]}
          fontSize={0.13}
          color="#FFFEF6"
          outlineWidth={0.016}
          outlineColor="#0A0203"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.52}
          letterSpacing={0.02}
        >
          {customLabel}
        </Text>
      ) : (
        showLogo && (
          <mesh position={[0, WORDMARK_Y, WORDMARK_Z]}>
            <planeGeometry args={[0.62, 0.18]} />
            <meshBasicMaterial
              map={logoTex}
              transparent
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        )
      )}

      {/* "ORIGINAL TASTE" micro-strip below wordmark */}
      <mesh position={[0, STRIP_Y, STRIP_Z]}>
        <planeGeometry args={[0.2, 0.025]} />
        <meshBasicMaterial color="#FFFEF6" transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Neck ring — collar swell at y ≈ 1.34 per new profile */}
      <mesh position={[0, 1.340, 0]}>
        <torusGeometry args={[0.152, 0.010, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Crown cap — replaces old screw cap (see CrownCrimps for 21 flutes) */}
      <CrownCrimps logoTex={logoTex} />

      {/* Base punt ring — foot ring at y ≈ 0.028, radius matches new base flare */}
      <mesh position={[0, 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.255, 0.016, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Historic dimpled-bottom embossed base ring — mid-punt level */}
      <mesh position={[0, 0.050, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.210, 0.005, 8, 32]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.35} metalness={0.12} />
      </mesh>
    </group>
  );
}
