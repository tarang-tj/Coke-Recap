/**
 * VendingMachine — nostalgic 1960s-style Coca-Cola vending machine hub.
 * Cream body, chrome trim, illuminated header, lit selection buttons, glass bay.
 *
 * Polish pass 3 (phase-02) additions:
 *   - Rounded chrome top hood above the cabinet
 *   - Embossed "Drink Coca-Cola" slogan on lower cabinet front
 *   - Bottle-shaped buttons (mini CokeBottle heads, same interactions as before)
 *   - Enriched coin-slot: chrome rim + "$0.10" price badge
 *   - More substantial footed base with chrome corner kickplates
 *   - Subtle side-panel "Coca-Cola" embossing
 */
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { useLogoTexture } from '../../hooks/use-logo-texture';
import { CokeBottle } from './coke-bottle';
import { BottleGltf } from './bottle-gltf';

export type MachineItemId = 'role' | 'tools' | 'agent' | 'takeaways';

export interface MachineItem {
  id: MachineItemId;
  label: string;
}

export interface VendingMachineProps {
  items: MachineItem[];
  onSelect: (id: MachineItemId) => void;
  hoveredId?: MachineItemId | null;
  active?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const BOTTLE_X = [-0.95, -0.32, 0.32, 0.95];
const BOTTLE_Y = 0.35;
const BOTTLE_Z = 0.55;
const LIFT_HOVER = 0.14;
const LERP = 9;

const CHROME = '#C8C4BC';
const CREAM = '#E8E0D0';
const COKE_RED = '#F40009';
const DARK = '#1A0004';

const noopRaycast = (
  _r: THREE.Raycaster,
  _i: THREE.Intersection<THREE.Object3D>[],
): void => {};

interface BottleSlotProps {
  item: MachineItem;
  bx: number;
  isHovered: boolean;
  isPressed: boolean;
  reduced: boolean;
  onSelect: (id: MachineItemId) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function BottleSlot({
  item,
  bx,
  isHovered,
  isPressed,
  reduced,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: BottleSlotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liftRef = useRef(0);
  const hovRef = useRef(isHovered);
  hovRef.current = isHovered;
  const pressRef = useRef(isPressed);
  pressRef.current = isPressed;
  const redRef = useRef(reduced);
  redRef.current = reduced;

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const t = redRef.current ? 1 : Math.min(1, LERP * dt);
    const targetLift = pressRef.current ? -0.35 : hovRef.current ? LIFT_HOVER : 0;
    liftRef.current += (targetLift - liftRef.current) * t;
    g.position.y = BOTTLE_Y + liftRef.current;
    const s = hovRef.current ? 1.06 : 1;
    g.scale.setScalar(s);
  });

  return (
    <group
      ref={groupRef}
      position={[bx, BOTTLE_Y, BOTTLE_Z]}
      onPointerOver={(e) => { e.stopPropagation(); onHoverStart(); }}
      onPointerOut={(e) => { e.stopPropagation(); onHoverEnd(); }}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
    >
      <BottleGltf
        scale={0.58}
        highlight={isHovered ? 1 : 0.2}
      />
      <Text
        position={[0, -0.22, 0.15]}
        fontSize={0.11}
        color={CREAM}
        anchorX="center"
        anchorY="top"
        outlineColor={DARK}
        outlineWidth={0.005}
        maxWidth={0.55}
      >
        {item.label}
      </Text>
    </group>
  );
}

interface SelectButtonProps {
  index: number;
  item: MachineItem;
  isHovered: boolean;
  isPressed: boolean;
  onSelect: (id: MachineItemId) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

/**
 * Bottle-shaped selection button.
 * The chrome bezel is preserved; the pill cylinder is replaced by a tiny
 * CokeBottle (scale 0.12, showLogo=false) so the button head reads as a
 * miniature bottle cap viewed from the front. Hover lift, press scrunch,
 * and emissive glow-on-lit are all kept from the original cylinder pill.
 */
function SelectButton({
  index,
  item,
  isHovered,
  isPressed,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: SelectButtonProps) {
  const by = 0.55 - index * 0.38;
  const lit = isHovered || isPressed;

  return (
    <group
      position={[1.35, by, 0.62]}
      onPointerOver={(e) => { e.stopPropagation(); onHoverStart(); }}
      onPointerOut={(e) => { e.stopPropagation(); onHoverEnd(); }}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
    >
      {/* Chrome bezel ring — kept from original */}
      <mesh position={[0, 0, -0.02]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
        <meshStandardMaterial color={CHROME} roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Glow disc behind the bottle — replaces the old lit pill */}
      <mesh position={[0, 0, -0.01]} scale={isPressed ? 0.92 : 1}>
        <cylinderGeometry args={[0.10, 0.10, 0.02, 24]} />
        <meshStandardMaterial
          color={lit ? '#FFD740' : COKE_RED}
          emissive={lit ? '#FFD740' : '#660000'}
          emissiveIntensity={lit ? 1.2 : 0.3}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      {/* Mini bottle head — top-down view of the contour bottle */}
      <group
        position={[0, 0, 0.04]}
        scale={isPressed ? 0.88 : 1}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <CokeBottle scale={0.12} showLogo={false} highlight={lit ? 1 : 0.2} />
      </group>

      {/* Number index floating in front */}
      <Text
        position={[0, 0, 0.12]}
        fontSize={0.07}
        color={lit ? DARK : CREAM}
        anchorX="center"
        anchorY="middle"
      >
        {String(index + 1)}
      </Text>
    </group>
  );
}

export function VendingMachine({
  items,
  onSelect,
  hoveredId,
  active = true,
  position,
  rotation,
}: VendingMachineProps) {
  const reduced = useReducedMotion();
  const logoTex = useLogoTexture('#FFFEF6');
  const machineRef = useRef<THREE.Group>(null);
  const dispenseGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const headerGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const clockRef = useRef(0);

  const [internalHoveredId, setInternalHoveredId] = useState<MachineItemId | null>(null);
  const [pressedId, setPressedId] = useState<MachineItemId | null>(null);
  const [dispenseFlash, setDispenseFlash] = useState(0);

  useEffect(() => {
    if (!active) {
      setInternalHoveredId(null);
      setPressedId(null);
      document.body.style.cursor = '';
    }
  }, [active]);

  const handleSelect = (id: MachineItemId) => {
    setPressedId(id);
    setDispenseFlash(1);
    document.body.style.cursor = '';
    // Brief vend animation before navigation
    window.setTimeout(() => {
      onSelect(id);
      setPressedId(null);
    }, 420);
  };

  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useFrame((_, dt) => {
    const g = machineRef.current;
    if (!g) return;

    if (!reducedRef.current) {
      clockRef.current += dt;
      g.position.y = Math.sin(clockRef.current * 0.6) * 0.002;
    }

    if (dispenseFlash > 0) {
      setDispenseFlash((f) => Math.max(0, f - dt * 2.5));
    }

    const dg = dispenseGlowRef.current;
    if (dg) {
      const target = dispenseFlash > 0 ? 0.9 * dispenseFlash : 0.15;
      dg.emissiveIntensity += (target - dg.emissiveIntensity) * Math.min(1, dt * 10);
    }

    const hg = headerGlowRef.current;
    if (hg) {
      const pulse = reducedRef.current ? 0.5 : 0.45 + 0.12 * Math.sin(clockRef.current * 1.8);
      hg.emissiveIntensity += (pulse - hg.emissiveIntensity) * 0.08;
    }
  });

  const isHov = (id: MachineItemId) =>
    id === internalHoveredId || id === hoveredId;

  const setHover = (id: MachineItemId | null) => {
    setInternalHoveredId(id);
    document.body.style.cursor = id ? 'pointer' : '';
  };

  return (
    <group position={position} rotation={rotation}>
      <group ref={machineRef}>

        {/* ── MAIN CABINET — cream body, nostalgic upright proportions ── */}
        <RoundedBox args={[2.8, 5.6, 1.1]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color={CREAM} roughness={0.65} metalness={0.05} />
        </RoundedBox>

        {/* Red side panels (classic Coke stripe) */}
        {([-1.42, 1.42] as const).map((x) => (
          <RoundedBox
            key={x}
            args={[0.12, 5.2, 0.9]}
            radius={0.02}
            smoothness={2}
            position={[x, 0, 0.05]}
          >
            <meshStandardMaterial color={COKE_RED} roughness={0.45} metalness={0.1} />
          </RoundedBox>
        ))}

        {/* Chrome corner strips */}
        {([-1.35, 1.35] as const).map((x) => (
          <mesh key={`chrome-${x}`} position={[x, 0, 0.58]}>
            <boxGeometry args={[0.06, 5.4, 0.04]} />
            <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
          </mesh>
        ))}

        {/* ── ROUNDED CHROME TOP HOOD ── */}
        {/* Main hood body — sits above the upper chrome trim at y=2.78 */}
        <RoundedBox
          args={[2.85, 0.38, 1.18]}
          radius={0.12}
          smoothness={4}
          position={[0, 3.06, 0.02]}
        >
          <meshStandardMaterial
            color={CHROME}
            roughness={0.18}
            metalness={0.88}
          />
        </RoundedBox>
        {/* Hood front overhang — slight forward curve to mimic vintage visor */}
        <RoundedBox
          args={[2.65, 0.14, 0.28]}
          radius={0.07}
          smoothness={3}
          position={[0, 2.88, 0.62]}
        >
          <meshStandardMaterial color={CHROME} roughness={0.22} metalness={0.85} />
        </RoundedBox>
        {/* Hood top cap strip */}
        <mesh position={[0, 3.26, 0.0]}>
          <boxGeometry args={[2.76, 0.06, 1.1]} />
          <meshStandardMaterial color="#B8B4AC" roughness={0.15} metalness={0.92} />
        </mesh>

        {/* ── ILLUMINATED HEADER SIGN ── (UNCHANGED — user approved) */}
        <RoundedBox
          args={[2.5, 0.85, 0.08]}
          radius={0.03}
          smoothness={3}
          position={[0, 2.35, 0.58]}
        >
          <meshStandardMaterial
            ref={headerGlowRef}
            color={DARK}
            emissive={COKE_RED}
            emissiveIntensity={0.5}
            roughness={0.5}
          />
        </RoundedBox>

        {/* Logo on header */}
        <mesh position={[0, 2.42, 0.63]}>
          <planeGeometry args={[1.8, 0.55]} />
          <meshBasicMaterial map={logoTex} transparent toneMapped={false} />
        </mesh>

        {/* "ICE COLD" vintage subline */}
        <Text
          position={[0, 2.05, 0.63]}
          fontSize={0.13}
          color={CREAM}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          ICE COLD
        </Text>

        {/* Chrome header trim bands */}
        <mesh position={[0, 1.88, 0.6]}>
          <boxGeometry args={[2.5, 0.04, 0.03]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 2.78, 0.6]}>
          <boxGeometry args={[2.5, 0.04, 0.03]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* ── GLASS DISPLAY BAY (recessed, chrome frame) ── */}
        {/* Dark interior backing — lit from inside */}
        <RoundedBox
          args={[2.2, 1.75, 0.12]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.55, 0.42]}
        >
          <meshStandardMaterial
            color="#0D0002"
            emissive={COKE_RED}
            emissiveIntensity={0.25}
            roughness={0.9}
          />
        </RoundedBox>

        {/* Interior warm light */}
        <pointLight position={[0, 0.55, 0.3]} intensity={1.2} color="#FFD8A0" distance={3} />

        {/* Chrome window frame — top */}
        <mesh position={[0, 1.48, 0.58]}>
          <boxGeometry args={[2.3, 0.06, 0.05]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>
        {/* frame — bottom */}
        <mesh position={[0, -0.38, 0.58]}>
          <boxGeometry args={[2.3, 0.06, 0.05]} />
          <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
        </mesh>
        {/* frame — sides */}
        {([-1.12, 1.12] as const).map((x) => (
          <mesh key={`frame-${x}`} position={[x, 0.55, 0.58]}>
            <boxGeometry args={[0.06, 1.9, 0.05]} />
            <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
          </mesh>
        ))}

        {/* Shelf ledge */}
        <mesh position={[0, 0.05, 0.55]}>
          <boxGeometry args={[2.2, 0.05, 0.25]} />
          <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.7} />
        </mesh>

        {/* ── BOTTLES ── */}
        {items.map((item, i) => (
          <BottleSlot
            key={item.id}
            item={item}
            bx={BOTTLE_X[i] ?? 0}
            isHovered={isHov(item.id)}
            isPressed={pressedId === item.id}
            reduced={reduced}
            onSelect={handleSelect}
            onHoverStart={() => setHover(item.id)}
            onHoverEnd={() => setHover(null)}
          />
        ))}

        {/* Glass panel — pointer passes through to bottles */}
        <mesh position={[0, 0.55, 0.72]} renderOrder={1} raycast={noopRaycast}>
          <planeGeometry args={[2.15, 1.7]} />
          <meshPhysicalMaterial
            color="#88CCFF"
            transparent
            opacity={0.12}
            roughness={0.05}
            metalness={0.1}
            clearcoat={1}
            depthWrite={false}
          />
        </mesh>

        {/* ── SELECTION BUTTONS (interactive — now bottle-shaped) ── */}
        {items.map((item, i) => (
          <SelectButton
            key={`btn-${item.id}`}
            index={i}
            item={item}
            isHovered={isHov(item.id)}
            isPressed={pressedId === item.id}
            onSelect={handleSelect}
            onHoverStart={() => setHover(item.id)}
            onHoverEnd={() => setHover(null)}
          />
        ))}

        {/* ── COIN SLOT (left) — enriched with chrome rim + price badge ── */}
        <group position={[-1.05, -0.6, 0.6]}>
          {/* Panel backing */}
          <RoundedBox args={[0.5, 0.72, 0.06]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#2A1010" roughness={0.5} metalness={0.2} />
          </RoundedBox>

          {/* Coin slot opening */}
          <mesh position={[0, 0.15, 0.04]}>
            <boxGeometry args={[0.28, 0.04, 0.02]} />
            <meshStandardMaterial color="#080002" roughness={0.95} />
          </mesh>

          {/* Chrome rim around the coin slot */}
          <mesh position={[0, 0.15, 0.05]}>
            <boxGeometry args={[0.32, 0.08, 0.01]} />
            <meshStandardMaterial color={CHROME} roughness={0.22} metalness={0.88} />
          </mesh>
          {/* Inner cutout — slightly smaller chrome frame overlay to create inset look */}
          <mesh position={[0, 0.15, 0.06]}>
            <boxGeometry args={[0.29, 0.05, 0.005]} />
            <meshStandardMaterial color="#2A1010" roughness={0.5} metalness={0.2} />
          </mesh>
          {/* Slot slit visible in center */}
          <mesh position={[0, 0.15, 0.065]}>
            <boxGeometry args={[0.22, 0.025, 0.005]} />
            <meshStandardMaterial color="#080002" roughness={0.95} />
          </mesh>

          {/* "INSERT COIN" label */}
          <Text position={[0, -0.08, 0.04]} fontSize={0.07} color={CREAM} anchorX="center">
            INSERT COIN
          </Text>

          {/* "$0.10" price badge — vintage realism */}
          <RoundedBox
            args={[0.22, 0.10, 0.015]}
            radius={0.015}
            smoothness={2}
            position={[0, -0.24, 0.04]}
          >
            <meshStandardMaterial color={CHROME} roughness={0.28} metalness={0.82} />
          </RoundedBox>
          <Text
            position={[0, -0.24, 0.052]}
            fontSize={0.065}
            color={DARK}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.02}
          >
            $0.10
          </Text>
        </group>

        {/* ── DISPENSE CHUTE (glows on selection) ── */}
        <RoundedBox
          args={[1.5, 0.2, 0.12]}
          radius={0.03}
          smoothness={2}
          position={[0, -1.85, 0.58]}
        >
          <meshStandardMaterial color="#080002" roughness={0.9} />
        </RoundedBox>
        <mesh position={[0, -1.85, 0.66]}>
          <boxGeometry args={[1.3, 0.1, 0.04]} />
          <meshStandardMaterial
            ref={dispenseGlowRef}
            color="#1A0004"
            emissive={COKE_RED}
            emissiveIntensity={0.15}
            roughness={0.8}
          />
        </mesh>

        {/* ── EMBOSSED "Drink Coca-Cola" SLOGAN — lower cabinet front ── */}
        {/* Recessed plate (slightly inset) */}
        <mesh position={[0, -2.3, 0.57]}>
          <boxGeometry args={[1.6, 0.22, 0.005]} />
          <meshStandardMaterial color="#D8D0C0" roughness={0.7} metalness={0.05} />
        </mesh>
        {/* Embossed text — sits just proud of the plate (z + 0.015) */}
        <Text
          position={[0, -2.30, 0.585]}
          fontSize={0.10}
          color={CHROME}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          outlineColor="#8A8078"
          outlineWidth={0.003}
        >
          Drink Coca-Cola
        </Text>

        {/* ── SIDE EMBOSSING — subtle "Coca-Cola" on cream side panels ── */}
        {/* Left side panel embossing */}
        <Text
          position={[-1.38, -0.5, 0.0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.09}
          color="#C8BEB0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
          outlineColor="#A89880"
          outlineWidth={0.002}
          fillOpacity={0.35}
        >
          Coca-Cola
        </Text>
        {/* Right side panel embossing */}
        <Text
          position={[1.38, -0.5, 0.0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.09}
          color="#C8BEB0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
          outlineColor="#A89880"
          outlineWidth={0.002}
          fillOpacity={0.35}
        >
          Coca-Cola
        </Text>

        {/* ── FOOTED BASE — more substantial, chrome kickplates ── */}
        {/* Main base plate — extended and taller */}
        <mesh position={[0, -2.85, 0.1]}>
          <boxGeometry args={[2.7, 0.18, 1.05]} />
          <meshStandardMaterial color="#3A3530" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Chrome front kickplate — full-width strip along the base front */}
        <mesh position={[0, -2.82, 0.57]}>
          <boxGeometry args={[2.7, 0.14, 0.025]} />
          <meshStandardMaterial color={CHROME} roughness={0.22} metalness={0.88} />
        </mesh>

        {/* Chrome corner kickplates — front-left and front-right */}
        {([-1.3, 1.3] as const).map((x) => (
          <mesh key={`kick-${x}`} position={[x, -2.82, 0.46]}>
            <boxGeometry args={[0.08, 0.14, 0.24]} />
            <meshStandardMaterial color={CHROME} roughness={0.20} metalness={0.90} />
          </mesh>
        ))}

        {/* Rubber feet — moved outward so visible from front */}
        {([-1.15, 1.15] as const).map((x) => (
          <mesh key={`foot-${x}`} position={[x, -2.95, 0.45]}>
            <cylinderGeometry args={[0.09, 0.11, 0.06, 12]} />
            <meshStandardMaterial color="#1A1816" roughness={0.95} />
          </mesh>
        ))}

      </group>
    </group>
  );
}
