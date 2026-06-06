/**
 * VendingMachine — stylised 3-D Coca-Cola vending-machine hub.
 *
 * Self-contained R3F component. Only imports:
 *   @react-three/fiber, @react-three/drei, three, and
 *   ../../hooks/use-reduced-motion.
 *
 * Machine is centred at [0,0,0]; apply `position`/`rotation` props to place it.
 * Camera is assumed near [0, 0.6, 7] looking at [0, 0.3, 0].
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// ─── Public API ───────────────────────────────────────────────────────────────

export type MachineItemId = 'role' | 'tools' | 'agent' | 'takeaways';

export interface MachineItem {
  id: MachineItemId;
  label: string;
  color: string;
}

export interface VendingMachineProps {
  /** Exactly 4 items displayed in shelf order left-to-right. */
  items: MachineItem[];
  onSelect: (id: MachineItemId) => void;
  /** Optional external hover — combined with internal pointer state. */
  hoveredId?: MachineItemId | null;
  /** When false (hub off-screen), clears latched hover + cursor. Default true. */
  active?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// ─── Layout constants ─────────────────────────────────────────────────────────

/** Bottle x-positions within machine (even spread, no overlap at max belly ≈0.32 wide). */
const BOTTLE_X: number[] = [-1.05, -0.35, 0.35, 1.05];

/** Y of bottle group's base when at rest. */
const BOTTLE_Y_BASE = 0.0;

// The cabinet is a SOLID RoundedBox whose front face is at z = 0.70, so the
// display case must sit IN FRONT of that face (otherwise the bottles are
// occluded inside the box). Bottles + glass protrude slightly like a real
// machine's display window.
/** Z of bottle group — in front of the cabinet face. */
const BOTTLE_Z = 0.92;

/** Z of the glass front panel (in front of the bottles). */
const GLASS_Z = 1.12;

const LIFT_HOVER  = 0.12; // vertical lift (world units) on hover
const SCALE_HOVER = 1.08; // uniform scale on hover
const LERP_SPEED  = 8;    // lerp coefficient (per-second)

/**
 * Raycast no-op for the glass panel — typed to match THREE.Mesh.raycast.
 * Lets pointer events pass through to the bottles behind the glass.
 */
const noopRaycast = (
  _r: THREE.Raycaster,
  _i: THREE.Intersection<THREE.Object3D>[],
): void => {};

// ─── Bottle geometry (built once, shared by all four meshes) ──────────────────

/**
 * Coca-Cola "hobble-skirt" / contour-bottle LatheGeometry.
 * Vector2(radius, height) — y goes from 0 (base) to 1.0 (lip).
 */
function buildBottleGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.055, 0.00), // base centre
    new THREE.Vector2(0.120, 0.04), // base rim
    new THREE.Vector2(0.148, 0.10), // lower body
    new THREE.Vector2(0.158, 0.20), // lower belly
    new THREE.Vector2(0.162, 0.30), // widest belly
    new THREE.Vector2(0.154, 0.38), // upper belly
    new THREE.Vector2(0.118, 0.44), // waist start (hobble notch)
    new THREE.Vector2(0.100, 0.47), // hobble minimum
    new THREE.Vector2(0.126, 0.53), // above waist
    new THREE.Vector2(0.154, 0.59), // shoulder
    new THREE.Vector2(0.132, 0.67), // shoulder taper
    new THREE.Vector2(0.080, 0.76), // neck lower
    new THREE.Vector2(0.065, 0.86), // neck upper
    new THREE.Vector2(0.058, 0.93), // mouth
    new THREE.Vector2(0.058, 1.00), // lip
  ];
  return new THREE.LatheGeometry(pts, 24);
}

// ─── Internal: BottleUnit ─────────────────────────────────────────────────────

interface BottleUnitProps {
  item: MachineItem;
  bx: number;
  geometry: THREE.LatheGeometry;
  isHovered: boolean;
  reduced: boolean;
  onSelect: (id: MachineItemId) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function BottleUnit({
  item,
  bx,
  geometry,
  isHovered,
  reduced,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: BottleUnitProps) {
  const groupRef    = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Per-frame scalars — never re-allocated
  const liftY  = useRef(0);
  const scaleV = useRef(1);

  // Stable refs so useFrame closure always reads the latest prop values
  const hovRef = useRef(isHovered);
  hovRef.current = isHovered;
  const redRef = useRef(reduced);
  redRef.current = reduced;

  // Color object built once per item color
  const colorObj = useMemo(() => new THREE.Color(item.color), [item.color]);

  useFrame((_s, dt) => {
    const g = groupRef.current;
    const m = materialRef.current;
    if (!g) return;

    const hov = hovRef.current;
    // Snap instantly for reduced motion, otherwise lerp
    const t   = redRef.current ? 1.0 : Math.min(1.0, LERP_SPEED * dt);

    liftY.current  += ((hov ? LIFT_HOVER  : 0.0 ) - liftY.current)  * t;
    scaleV.current += ((hov ? SCALE_HOVER : 1.0 ) - scaleV.current) * t;

    // Mutate the Three.js object directly — no React state, no re-renders
    g.position.y = BOTTLE_Y_BASE + liftY.current;
    g.scale.setScalar(scaleV.current);

    // Animate emissive intensity for glow brightening on hover
    if (m) {
      m.emissiveIntensity += ((hov ? 0.65 : 0.22) - m.emissiveIntensity) * t;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[bx, BOTTLE_Y_BASE, BOTTLE_Z]}
      onPointerOver={(e) => { e.stopPropagation(); onHoverStart(); }}
      onPointerOut={(e)  => { e.stopPropagation(); onHoverEnd();   }}
      onClick={(e)       => { e.stopPropagation(); onSelect(item.id); }}
    >
      {/* Contour bottle mesh — geometry is shared (LatheGeometry) */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={materialRef}
          color={colorObj}
          roughness={0.28}
          metalness={0.12}
          emissive={colorObj}
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* Chapter label centred below the bottle base */}
      <Text
        position={[0, -0.18, 0.18]}
        fontSize={0.14}
        color="#F1E9DA"
        anchorX="center"
        anchorY="top"
        outlineColor="#1A0004"
        outlineWidth={0.006}
        maxWidth={0.6}
      >
        {item.label}
      </Text>
    </group>
  );
}

// ─── Internal: ButtonUnit (decorative selection button) ───────────────────────

interface ButtonUnitProps {
  index: number;
  isHovered: boolean;
}

function ButtonUnit({ index, isHovered }: ButtonUnitProps) {
  // Stacked vertically on the right side of the front panel
  const by = 0.42 - index * 0.32;
  return (
    <group position={[1.26, by, 0.72]}>
      <RoundedBox args={[0.18, 0.12, 0.05]} radius={0.025} smoothness={3}>
        <meshStandardMaterial
          color={isHovered ? '#FFD740' : '#B31010'}
          emissive={isHovered ? '#FFD740' : '#880000'}
          emissiveIntensity={isHovered ? 0.9 : 0.25}
          roughness={0.3}
          metalness={0.25}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.07}
        color="#F1E9DA"
        anchorX="center"
        anchorY="middle"
      >
        {String(index + 1)}
      </Text>
    </group>
  );
}

// ─── Main export: VendingMachine ──────────────────────────────────────────────

export function VendingMachine({
  items,
  onSelect,
  hoveredId,
  active = true,
  position,
  rotation,
}: VendingMachineProps) {
  const reduced    = useReducedMotion();
  const machineRef = useRef<THREE.Group>(null);
  const clock      = useRef(0);

  const [internalHoveredId, setInternalHoveredId] =
    useState<MachineItemId | null>(null);

  // When the hub leaves view without the pointer moving, R3F won't fire
  // onPointerOut — so clear any latched hover + cursor here.
  useEffect(() => {
    if (!active) {
      setInternalHoveredId(null);
      document.body.style.cursor = '';
    }
  }, [active]);

  // Bottle geometry created once, shared across all four BottleUnit instances
  const bottleGeometry = useMemo(() => buildBottleGeometry(), []);

  // Stable ref so the idle-bob useFrame always reads the latest `reduced` value
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Tiny idle "hum" — the inner group oscillates ±0.0035 units on Y.
  // Frozen when reduced motion is preferred.
  useFrame((_s, dt) => {
    const g = machineRef.current;
    if (!g) return;
    if (reducedRef.current) {
      g.position.y = 0;
      return;
    }
    clock.current += dt * 0.5;
    g.position.y = Math.sin(clock.current) * 0.0035;
  });

  const isHov = (id: MachineItemId): boolean =>
    id === internalHoveredId || id === hoveredId;

  return (
    // Outer group: carries the position / rotation props from the caller
    <group position={position} rotation={rotation}>

      {/* Inner group: carries the idle-bob animation via ref */}
      <group ref={machineRef}>

        {/* ── CABINET BODY ──────────────────────────────────────── */}
        {/* Glossy Coca-Cola red shell, clearcoat gives high-gloss sheen */}
        <RoundedBox args={[3.2, 5.0, 1.4]} radius={0.08} smoothness={4}>
          <meshPhysicalMaterial
            color="#F40009"
            clearcoat={1}
            clearcoatRoughness={0.2}
            roughness={0.35}
            metalness={0.1}
            emissive="#8B0003"
            emissiveIntensity={0.18}
          />
        </RoundedBox>

        {/* ── HEADER PANEL (dark inset at top-front) ────────────── */}
        <RoundedBox
          args={[2.9, 0.72, 0.06]}
          radius={0.04}
          smoothness={4}
          position={[0, 2.12, 0.71]}
        >
          <meshStandardMaterial color="#160004" roughness={0.55} metalness={0.15} />
        </RoundedBox>

        {/* Cream pinstripe trim — upper edge of header */}
        <RoundedBox
          args={[2.9, 0.035, 0.04]}
          radius={0.01}
          smoothness={2}
          position={[0, 1.76, 0.71]}
        >
          <meshStandardMaterial
            color="#F1E9DA"
            roughness={0.7}
            emissive="#F1E9DA"
            emissiveIntensity={0.08}
          />
        </RoundedBox>

        {/* Cream pinstripe trim — lower edge of header */}
        <RoundedBox
          args={[2.9, 0.035, 0.04]}
          radius={0.01}
          smoothness={2}
          position={[0, 2.49, 0.71]}
        >
          <meshStandardMaterial
            color="#F1E9DA"
            roughness={0.7}
            emissive="#F1E9DA"
            emissiveIntensity={0.08}
          />
        </RoundedBox>

        {/* Tasteful header text — real logo is overlaid by the app */}
        <Text
          position={[0, 2.13, 0.755]}
          fontSize={0.21}
          color="#F1E9DA"
          letterSpacing={0.2}
          anchorX="center"
          anchorY="middle"
        >
          ENJOY
        </Text>

        {/* ── SHELF AREA ────────────────────────────────────────── */}

        {/* Dark backing panel visible behind the bottles through the glass */}
        <RoundedBox
          args={[2.75, 1.62, 0.05]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.3, 0.74]}
        >
          <meshStandardMaterial color="#220006" roughness={0.85} />
        </RoundedBox>

        {/* Horizontal shelf ledge the bottles sit on */}
        <RoundedBox
          args={[2.75, 0.06, 0.36]}
          radius={0.02}
          smoothness={2}
          position={[0, -0.06, 0.92]}
        >
          <meshStandardMaterial color="#1A0004" roughness={0.7} metalness={0.25} />
        </RoundedBox>

        {/* ── BOTTLES (4 interactive contour silhouettes) ────────── */}
        {items.map((item, i) => (
          <BottleUnit
            key={item.id}
            item={item}
            bx={BOTTLE_X[i] ?? 0}
            geometry={bottleGeometry}
            isHovered={isHov(item.id)}
            reduced={reduced}
            onSelect={onSelect}
            onHoverStart={() => {
              setInternalHoveredId(item.id);
              document.body.style.cursor = 'pointer';
            }}
            onHoverEnd={() => {
              setInternalHoveredId(null);
              document.body.style.cursor = '';
            }}
          />
        ))}

        {/* ── GLASS FRONT PANEL ─────────────────────────────────── */}
        {/*
          renderOrder=1  → draws after all opaque bottles
          depthWrite=false → doesn't occlude bottles in the depth buffer
          noopRaycast    → pointer events pass through to bottles behind it
        */}
        <mesh
          position={[0, 0.3, GLASS_Z]}
          renderOrder={1}
          raycast={noopRaycast}
        >
          <planeGeometry args={[2.75, 1.65]} />
          <meshStandardMaterial
            color="#0A0203"
            transparent
            opacity={0.18}
            roughness={0.1}
            depthWrite={false}
          />
        </mesh>

        {/* ── BUTTON STRIP (decorative, right side) ─────────────── */}
        {items.map((item, i) => (
          <ButtonUnit
            key={`btn-${item.id}`}
            index={i}
            isHovered={isHov(item.id)}
          />
        ))}

        {/* ── DISPENSE SLOT (cosmetic, lower front) ─────────────── */}
        <RoundedBox
          args={[1.75, 0.17, 0.10]}
          radius={0.04}
          smoothness={3}
          position={[0, -2.05, 0.71]}
        >
          <meshStandardMaterial color="#0D0002" roughness={0.9} />
        </RoundedBox>
        {/* Recessed inner slot face */}
        <RoundedBox
          args={[1.55, 0.10, 0.07]}
          radius={0.03}
          smoothness={2}
          position={[0, -2.05, 0.76]}
        >
          <meshStandardMaterial color="#060001" roughness={0.95} />
        </RoundedBox>

        {/* ── COIN / CARD PANEL (cosmetic, left side) ───────────── */}
        <RoundedBox
          args={[0.55, 0.75, 0.05]}
          radius={0.03}
          smoothness={3}
          position={[-1.1, -0.85, 0.72]}
        >
          <meshStandardMaterial color="#1A0005" roughness={0.5} metalness={0.1} />
        </RoundedBox>
        {/* Card-slot illusion — thin dark strip */}
        <RoundedBox
          args={[0.32, 0.035, 0.03]}
          radius={0.01}
          smoothness={2}
          position={[-1.1, -0.65, 0.755]}
        >
          <meshStandardMaterial color="#050001" roughness={0.95} />
        </RoundedBox>

        {/* ── BASE / FOOT ───────────────────────────────────────── */}
        <RoundedBox
          args={[3.1, 0.10, 1.3]}
          radius={0.03}
          smoothness={3}
          position={[0, -2.55, 0]}
        >
          <meshStandardMaterial color="#1A0003" roughness={0.7} metalness={0.2} />
        </RoundedBox>

      </group>
    </group>
  );
}
