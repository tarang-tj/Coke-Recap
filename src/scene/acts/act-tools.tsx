import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { tools } from '../../data/portfolio-content';
import { BottleGltf } from '../brand/bottle-gltf';

// Act 2 — Tools: wooden Coca-Cola bottle crate still-life
//
// A 24-slot (6×4) divided wooden crate sits on aged wood planks.
// 6 contour bottles stand in 6 slots, each wearing a paper neck-tag
// with the tool name. Crate rotates ~1°/s. Single warm overhead spot.
//
// meshStandardMaterial / meshPhysicalMaterial only — zero transmission passes.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WOOD_BROWN = '#7A4F2C';
const IRON_DARK = '#2A2018';
const NAIL_COPPER = '#9C6E3A';
const TWINE_COLOR = '#A88B5C';
const TAG_CREAM = '#F0E8D0';
const TAG_INK = '#2A1A08';

// Crate outer dimensions (width × height × depth)
const CRATE_W = 1.8;
const CRATE_H = 0.55;
const CRATE_D = 1.2;
const WALL_T = 0.04; // wall thickness

// Divider grid: 6 cols × 4 rows = 24 slots
const COLS = 6;
const ROWS = 4;

// Slot dimensions (inner)
const SLOT_W = (CRATE_W - WALL_T * 2) / COLS; // ~0.287
const SLOT_D = (CRATE_D - WALL_T * 2) / ROWS; // ~0.280

// The 6 slots where bottles live — front two rows, spread across cols
// Row 0 = frontmost (smallest z), Row 1 = next row
const BOTTLE_SLOTS: [col: number, row: number][] = [
  [0, 0],
  [1, 0],
  [3, 0],
  [5, 0],
  [2, 1],
  [4, 1],
];

// Slot center in crate-local XZ (origin at crate center)
function slotCenter(col: number, row: number): [number, number] {
  const startX = -(CRATE_W / 2 - WALL_T) + SLOT_W / 2;
  const startZ = -(CRATE_D / 2 - WALL_T) + SLOT_D / 2;
  return [startX + col * SLOT_W, startZ + row * SLOT_D];
}

// Deterministic seeded pseudo-random for per-bottle Y rotation jitter
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const BOTTLE_Y_ROT_JITTER: number[] = (() => {
  const rng = seededRng(77);
  return BOTTLE_SLOTS.map(() => (rng() - 0.5) * ((15 * Math.PI) / 90));
})();

// ---------------------------------------------------------------------------
// CanvasTexture builders (baked in useMemo)
// ---------------------------------------------------------------------------

function buildCrateStencilTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Aged wood base
  ctx.fillStyle = WOOD_BROWN;
  ctx.fillRect(0, 0, W, H);

  // Add subtle horizontal grain lines
  for (let i = 0; i < 12; i++) {
    const y = (i / 12) * H;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random() * 4);
    ctx.lineTo(W, y + Math.random() * 4);
    ctx.stroke();
  }

  // Stencil text — "Drink Coca-Cola"
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Distressed cream paint — draw with noise alpha
  const text = 'Drink Coca-Cola';
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = '#F0E0C0';
  ctx.fillText(text, W / 2, H / 2 + 2);

  // Second pass slightly offset for worn paint look
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, W / 2 - 1, H / 2 - 1);

  ctx.globalAlpha = 1;

  // Scratch marks for distress
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function buildNeckTagTexture(toolName: string): THREE.CanvasTexture {
  // 512×384 for sharp reading at camera distance
  const W = 512;
  const H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Aged cream paper base — period paper tone
  ctx.fillStyle = '#EAD8B0';
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain overlay for warmth
  ctx.fillStyle = 'rgba(160,110,40,0.08)';
  ctx.fillRect(0, 0, W, H);

  // Dark ink border ~6px stroke
  ctx.strokeStyle = '#1A1408';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  // Inner lighter border for tag-printing feel
  ctx.strokeStyle = 'rgba(60,35,10,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // ── "TOOL" microtype stamp at top ──────────────────────────────────────────
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillStyle = '#A60010';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '4px';
  ctx.globalAlpha = 0.92;
  ctx.fillText('T  O  O  L', W / 2, 32);
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';

  // Thin red rule under the stamp
  ctx.strokeStyle = '#A60010';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(60, 72);
  ctx.lineTo(W - 60, 72);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Punched hole at top center (twine anchor) ───────────────────────────────
  // (drawn after border so it sits on top of the border line)
  ctx.beginPath();
  ctx.arc(W / 2, 85, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#C9A96E';
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,20,0.8)';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Tool name — bold typewriter, dark ink ────────────────────────────────
  // Scale font to fit: max 80px, scale down for long names
  const maxFontSize = 80;
  const minFontSize = 48;
  // Measure at max size first
  ctx.font = `bold ${maxFontSize}px "Courier New", monospace`;
  const measured = ctx.measureText(toolName);
  const availW = W - 80; // leave margin
  let fontSize = maxFontSize;
  if (measured.width > availW) {
    fontSize = Math.max(minFontSize, Math.floor(maxFontSize * (availW / measured.width)));
  }

  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Slight shadow for ink depth
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Main ink pass
  ctx.fillStyle = '#1A1408';
  ctx.globalAlpha = 0.95;
  ctx.fillText(toolName, W / 2, H * 0.62);

  // Second pass slightly offset — worn stamp texture
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#0E0B05';
  ctx.globalAlpha = 0.4;
  ctx.fillText(toolName, W / 2 - 1, H * 0.62 - 1);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  // Sharp anisotropic filtering so text stays crisp when viewed at angle
  tex.anisotropy = 8;
  return tex;
}

function buildPlankTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Plank colors (varying shades of aged brown)
  const plankColors = [
    '#6B3D1E', '#7A4A28', '#5E3518', '#704222',
    '#6A3C1C', '#7E4F2E',
  ];

  const plankH = H / plankColors.length;

  plankColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * plankH, W, plankH);

    // Grain lines within each plank
    for (let g = 0; g < 5; g++) {
      const y = i * plankH + (g / 5) * plankH;
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }

    // Grout line between planks
    if (i < plankColors.length - 1) {
      ctx.fillStyle = '#2A1A0A';
      ctx.fillRect(0, (i + 1) * plankH - 1.5, W, 3);
    }
  });

  // Dark edge vignette
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0.25)');
  grad.addColorStop(0.3, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// ---------------------------------------------------------------------------
// CrateWalls — outer box + stencil texture on long wall
// ---------------------------------------------------------------------------

function CrateWalls({ stencilTex }: { stencilTex: THREE.CanvasTexture }) {
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: WOOD_BROWN,
        roughness: 0.85,
        metalness: 0,
      }),
    [],
  );
  const stencilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: stencilTex,
        roughness: 0.85,
        metalness: 0,
      }),
    [stencilTex],
  );
  const ironMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: IRON_DARK,
        roughness: 0.6,
        metalness: 0.4,
      }),
    [],
  );
  const nailMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: NAIL_COPPER,
        roughness: 0.55,
        metalness: 0.5,
      }),
    [],
  );

  return (
    <group>
      {/* Base plate */}
      <mesh position={[0, -CRATE_H / 2 + WALL_T / 2, 0]} receiveShadow>
        <boxGeometry args={[CRATE_W, WALL_T, CRATE_D]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Front wall (−Z, faces camera) — plain wood */}
      <mesh position={[0, 0, -(CRATE_D / 2 - WALL_T / 2)]} castShadow>
        <boxGeometry args={[CRATE_W, CRATE_H, WALL_T]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Back wall (+Z) — plain wood */}
      <mesh position={[0, 0, CRATE_D / 2 - WALL_T / 2]} castShadow>
        <boxGeometry args={[CRATE_W, CRATE_H, WALL_T]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Left long wall (−X) — stencil "Drink Coca-Cola" */}
      <mesh position={[-(CRATE_W / 2 - WALL_T / 2), 0, 0]} castShadow>
        <boxGeometry args={[WALL_T, CRATE_H, CRATE_D]} />
        <primitive object={stencilMat} attach="material" />
      </mesh>

      {/* Right long wall (+X) — plain wood */}
      <mesh position={[CRATE_W / 2 - WALL_T / 2, 0, 0]} castShadow>
        <boxGeometry args={[WALL_T, CRATE_H, CRATE_D]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Iron strap top — front long wall */}
      <mesh position={[0, CRATE_H / 2 - 0.018, -(CRATE_D / 2 - 0.005)]}>
        <boxGeometry args={[CRATE_W + 0.01, 0.018, 0.006]} />
        <primitive object={ironMat} attach="material" />
      </mesh>
      {/* Iron strap bottom — front long wall */}
      <mesh position={[0, -CRATE_H / 2 + 0.018, -(CRATE_D / 2 - 0.005)]}>
        <boxGeometry args={[CRATE_W + 0.01, 0.018, 0.006]} />
        <primitive object={ironMat} attach="material" />
      </mesh>
      {/* Iron strap top — back long wall */}
      <mesh position={[0, CRATE_H / 2 - 0.018, CRATE_D / 2 - 0.005]}>
        <boxGeometry args={[CRATE_W + 0.01, 0.018, 0.006]} />
        <primitive object={ironMat} attach="material" />
      </mesh>
      {/* Iron strap bottom — back long wall */}
      <mesh position={[0, -CRATE_H / 2 + 0.018, CRATE_D / 2 - 0.005]}>
        <boxGeometry args={[CRATE_W + 0.01, 0.018, 0.006]} />
        <primitive object={ironMat} attach="material" />
      </mesh>

      {/* Corner nail accents — 4 top corners */}
      {(
        [
          [-CRATE_W / 2 + 0.03, CRATE_H / 2 - 0.04, -CRATE_D / 2 + 0.03],
          [CRATE_W / 2 - 0.03, CRATE_H / 2 - 0.04, -CRATE_D / 2 + 0.03],
          [-CRATE_W / 2 + 0.03, CRATE_H / 2 - 0.04, CRATE_D / 2 - 0.03],
          [CRATE_W / 2 - 0.03, CRATE_H / 2 - 0.04, CRATE_D / 2 - 0.03],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.01, 0.01, 0.012, 8]} />
          <primitive object={nailMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CrateDividers — internal 6×4 slot grid
// ---------------------------------------------------------------------------

function CrateDividers() {
  const divMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6B3F1F',
        roughness: 0.88,
        metalness: 0,
      }),
    [],
  );

  const divH = CRATE_H - WALL_T - 0.02; // slightly shorter than outer walls
  const divY = -0.01; // sit on base

  // Vertical dividers (run along Z, divide X into 6 cols)
  // 5 internal dividers = 6 columns
  const verticalDividers: [number, number, number][] = [];
  for (let i = 1; i < COLS; i++) {
    const x = -(CRATE_W / 2 - WALL_T) + i * SLOT_W;
    verticalDividers.push([x, divY, 0]);
  }

  // Horizontal dividers (run along X, divide Z into 4 rows)
  // 3 internal dividers = 4 rows
  const horizontalDividers: [number, number, number][] = [];
  for (let i = 1; i < ROWS; i++) {
    const z = -(CRATE_D / 2 - WALL_T) + i * SLOT_D;
    horizontalDividers.push([0, divY, z]);
  }

  return (
    <group>
      {verticalDividers.map((pos, i) => (
        <mesh key={`vd-${i}`} position={pos}>
          <boxGeometry args={[WALL_T * 0.8, divH, CRATE_D - WALL_T * 2]} />
          <primitive object={divMat} attach="material" />
        </mesh>
      ))}
      {horizontalDividers.map((pos, i) => (
        <mesh key={`hd-${i}`} position={pos}>
          <boxGeometry args={[CRATE_W - WALL_T * 2, divH, WALL_T * 0.8]} />
          <primitive object={divMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BottleInCrate — one bottle with twine + neck-tag
// ---------------------------------------------------------------------------

interface BottleInCrateProps {
  toolName: string;
  col: number;
  row: number;
  rotJitter: number;
  tagTex: THREE.CanvasTexture;
}

function BottleInCrate({ toolName, col, row, rotJitter, tagTex }: BottleInCrateProps) {
  const [cx, cz] = slotCenter(col, row);
  // Bottles sit on the crate base: y = -CRATE_H/2 + WALL_T
  const baseY = -CRATE_H / 2 + WALL_T;

  const tagMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tagTex,
        roughness: 0.8,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    [tagTex],
  );
  const twineMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: TWINE_COLOR,
        roughness: 0.9,
        metalness: 0,
      }),
    [],
  );

  return (
    <group position={[cx, baseY, cz]} rotation={[0, rotJitter, 0]}>
      {/* The Coke bottle — scale 0.7, GLB asset with neck-tag decoration below */}
      <BottleGltf scale={0.7} highlight={0.1} />

      {/* Twine ring around neck — at y ≈ 0.7 * 1.31 = 0.917 in local space */}
      <mesh position={[0, 0.917, 0]}>
        <torusGeometry args={[0.108, 0.004, 6, 16]} />
        <primitive object={twineMat} attach="material" />
      </mesh>

      {/* Paper neck-tag — enlarged for readability, pushed forward (+z) to clear glass.
          y=0.80 in crate-local space ≈ bottle-local y≈1.14 (÷ scale 0.7) — just below
          the crown cap. +z=0.14 offset clears the bottle glass. */}
      <mesh position={[0.0, 0.80, 0.14]} rotation={[0.05, 0.0, 0.06]}>
        <boxGeometry args={[0.32, 0.20, 0.005]} />
        <primitive object={tagMat} attach="material" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// WoodPlanks — aged floor planks under the crate
// ---------------------------------------------------------------------------

function WoodPlanks({ plankTex }: { plankTex: THREE.CanvasTexture }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plankTex,
        roughness: 0.95,
        metalness: 0,
      }),
    [plankTex],
  );

  return (
    <mesh position={[0, -CRATE_H / 2 - 0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5, 4]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// ActTools — orchestrates the crate still-life
// ---------------------------------------------------------------------------

export function ActTools() {
  const groupRef = useRef<THREE.Group>(null);
  const crateGroupRef = useRef<THREE.Group>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  // Hover state — ref-only; the spotlight intensity reads it inside useFrame.
  const hoveredRef = useRef(false);
  const spotIntensityRef = useRef(3.5);

  // Bake all canvas textures once
  const stencilTex = useMemo(() => buildCrateStencilTexture(), []);
  const plankTex = useMemo(() => buildPlankTexture(), []);
  // tools is a const module import — array identity is stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tagTextures = useMemo(
    () => tools.map((t) => buildNeckTagTexture(t.name)),
    [],
  );

  // Dispose all canvas-allocated textures on unmount to avoid GPU/CPU leaks
  useEffect(
    () => () => {
      stencilTex.dispose();
      plankTex.dispose();
      tagTextures.forEach((t) => t.dispose());
    },
    [stencilTex, plankTex, tagTextures],
  );

  useFrame(({ clock }, dt) => {
    const group = groupRef.current;
    const crateGroup = crateGroupRef.current;
    if (!group) return;

    const envelope = mixesRef.current.tools;
    const active = envelope > 0.002;

    group.visible = active;

    if (!active) {
      // Clear latched cursor when navigating away mid-hover
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }

    // Envelope-driven entrance
    group.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    group.scale.setScalar(0.6 + 0.4 * envelope);

    if (!crateGroup) return;

    const elapsed = clock.elapsedTime;

    if (!reduced) {
      // Slow continuous Y rotation ~1°/s = 0.01745 rad/s ≈ 0.018 rad/s
      crateGroup.rotation.y += dt * 0.018;
      // Subtle vertical bob
      crateGroup.position.y = -0.02 + 0.02 * Math.sin(elapsed * 0.55);
    }

    // Lerp spotlight intensity toward target
    const spot = spotLightRef.current;
    if (spot) {
      const targetIntensity = hoveredRef.current ? 4.2 : 3.5;
      spotIntensityRef.current = THREE.MathUtils.lerp(
        spotIntensityRef.current,
        targetIntensity,
        Math.min(1, dt * 5),
      );
      spot.intensity = spotIntensityRef.current;
    }
  });

  return (
    <group ref={groupRef} position={[0.6, 0, 0]} visible={false}>
      {/* Overhead warm spotlight — single source for still-life feel */}
      <spotLight
        ref={spotLightRef}
        position={[1.5, 5, 2]}
        angle={0.6}
        penumbra={0.7}
        intensity={3.5}
        color="#FFE4B5"
        distance={10}
        castShadow={false}
      />

      {/* Subtle ambient fill */}
      <ambientLight intensity={0.25} color="#FFF0D0" />

      {/* Crate group — rotates and bobs */}
      <group
        ref={crateGroupRef}
        rotation={[0, -0.35, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          hoveredRef.current = true;
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
          hoveredRef.current = false;
        }}
      >
        {/* Aged wood plank floor */}
        <WoodPlanks plankTex={plankTex} />

        {/* Crate outer walls */}
        <CrateWalls stencilTex={stencilTex} />

        {/* Internal divider grid — 6×4 slots */}
        <CrateDividers />

        {/* Historical brass plaque — front wall (-Z, faces camera at idle pose) */}
        <mesh position={[0, -CRATE_H * 0.20, -(CRATE_D / 2 + 0.020)]}>
          <boxGeometry args={[1.0, 0.10, 0.015]} />
          <meshStandardMaterial color="#8E7547" roughness={0.5} metalness={0.6} />
        </mesh>
        <Text
          position={[0, -CRATE_H * 0.20, -(CRATE_D / 2)]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.045}
          color="#2A1A08"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          font={undefined}
        >
          FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS
        </Text>

        {/* 6 bottles in selected slots */}
        {BOTTLE_SLOTS.map(([col, row], i) => (
          <BottleInCrate
            key={tools[i].id}
            toolName={tools[i].name}
            col={col}
            row={row}
            rotJitter={BOTTLE_Y_ROT_JITTER[i]}
            tagTex={tagTextures[i]}
          />
        ))}
      </group>
    </group>
  );
}
