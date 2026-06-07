/**
 * JacobsPharmacyExterior — Five Points Atlanta, 1886.
 * Procedural low-poly Victorian commercial storefront. Visible ONLY when
 * view === 'exterior'. Camera sits at street level (z=5, y=1.8) looking toward
 * the building facade (z=-10 to -8).
 *
 * Rules:
 *   - No transmission materials. Window glass = clearcoat + opacity only.
 *   - CanvasTextures baked once in useMemo, disposed in useEffect cleanup.
 *   - colorSpace = THREE.SRGBColorSpace on every texture.
 *   - Total geometry budget ~5k tris.
 */
import { useMemo, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';

// ---------------------------------------------------------------------------
// CanvasTexture factories
// ---------------------------------------------------------------------------

function buildBrickTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Mortar base
  ctx.fillStyle = '#C8B89A';
  ctx.fillRect(0, 0, W, H);

  // Brick rows — 20px tall bricks with 3px mortar
  const brickH = 20;
  const brickW = 46;
  const mortarW = 3;
  const mortarH = 3;
  const brickColors = ['#7A2A1A', '#8B3020', '#6E2218', '#823028', '#753020'];

  let row = 0;
  for (let y = 0; y < H; y += brickH + mortarH) {
    const offset = (row % 2) * (brickW / 2);
    for (let x = -brickW; x < W + brickW; x += brickW + mortarW) {
      const bx = x + offset;
      const color = brickColors[Math.floor(Math.random() * brickColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(bx, y, brickW, brickH);
      // slight shade variation on individual brick
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(bx, y, brickW, brickH);
      ctx.restore();
    }
    row++;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildCobblestoneTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark grout base
  ctx.fillStyle = '#4A4440';
  ctx.fillRect(0, 0, W, H);

  // Random rounded "cobble" shapes
  const stoneColors = ['#7E7060', '#8A7A6A', '#6E6458', '#827468', '#766860'];
  const count = 90;
  for (let i = 0; i < count; i++) {
    const cx = Math.random() * W;
    const cy = Math.random() * H;
    const rx = 18 + Math.random() * 14;
    const ry = 14 + Math.random() * 10;
    const angle = Math.random() * Math.PI;
    const color = stoneColors[Math.floor(Math.random() * stoneColors.length)];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // subtle highlight
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.5, ry * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildAwningTexture(): THREE.CanvasTexture {
  const W = 256;
  const H = 64;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Burgundy base
  ctx.fillStyle = '#5A0010';
  ctx.fillRect(0, 0, W, H);

  // Cream scallop trim along the bottom edge — triangular cutouts
  const scallops = 12;
  const sw = W / scallops;
  ctx.fillStyle = '#F0E6D2';
  for (let i = 0; i < scallops; i++) {
    const x = i * sw;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + sw / 2, H * 0.3);
    ctx.lineTo(x + sw, H);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JacobsPharmacyExterior() {
  const { view, entering } = useNavigation();

  const { brickTex, cobbleTex, awningTex } = useMemo(() => ({
    brickTex: buildBrickTexture(),
    cobbleTex: buildCobblestoneTexture(),
    awningTex: buildAwningTexture(),
  }), []);

  useEffect(() => {
    return () => {
      brickTex.dispose();
      cobbleTex.dispose();
      awningTex.dispose();
    };
  }, [brickTex, cobbleTex, awningTex]);

  return (
    <group name="jacobs-pharmacy-exterior" visible={view === 'exterior' || entering}>

      {/* ── Warm interior glow — placed behind windows ─────────────────── */}
      <pointLight
        color="#FFE4A0"
        intensity={2.5}
        position={[0, 0.2, -9.5]}
        distance={4}
        decay={1.8}
      />

      {/* ── Main building facade — 4 stories, z=-10 to z=-8 ────────────── */}
      {/* Primary wall slab */}
      <mesh position={[0, 2.5, -9.0]} receiveShadow>
        <boxGeometry args={[16, 7, 2]} />
        <meshStandardMaterial map={brickTex} roughness={0.88} metalness={0} />
      </mesh>

      {/* ── Upper floor windows (6 vague suggestions) ──────────────────── */}
      {([-4.5, -1.5, 1.5, 4.5] as const).map((x, i) => (
        <group key={`win-upper-${i}`} position={[x, 4.2, -8.0]}>
          {/* Window frame recess */}
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.15]} />
            <meshStandardMaterial color="#2A1A0E" roughness={0.8} metalness={0} />
          </mesh>
          {/* Window glass — low opacity, no transmission */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[0.85, 1.25]} />
            <meshPhysicalMaterial
              color="#A8C8D8"
              roughness={0.1}
              metalness={0.05}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              opacity={0.35}
              transparent
            />
          </mesh>
          {/* Curtain suggestion */}
          <mesh position={[0, 0, 0.07]}>
            <planeGeometry args={[0.75, 1.1]} />
            <meshStandardMaterial
              color="#E8D5B0"
              roughness={0.9}
              opacity={0.4}
              transparent
            />
          </mesh>
        </group>
      ))}

      {/* Second-floor windows, smaller */}
      {([-3.2, 0, 3.2] as const).map((x, i) => (
        <group key={`win-mid-${i}`} position={[x, 2.8, -8.0]}>
          <mesh>
            <boxGeometry args={[1.0, 1.3, 0.12]} />
            <meshStandardMaterial color="#2A1A0E" roughness={0.8} metalness={0} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[0.78, 1.1]} />
            <meshPhysicalMaterial
              color="#B0C8D0"
              roughness={0.12}
              metalness={0.05}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              opacity={0.3}
              transparent
            />
          </mesh>
        </group>
      ))}

      {/* ── Storefront trim band ─────────────────────────────────────────── */}
      {/* Cream stone-work band separating ground from upper floors */}
      <mesh position={[0, 1.35, -7.95]}>
        <boxGeometry args={[16, 0.22, 0.18]} />
        <meshStandardMaterial color="#D8C8A8" roughness={0.7} metalness={0} />
      </mesh>

      {/* ── Ground floor storefront wall panels ─────────────────────────── */}
      {/* Left panel (left of left window) */}
      <mesh position={[-6.8, 0, -8.0]}>
        <boxGeometry args={[2.4, 2.4, 0.14]} />
        <meshStandardMaterial map={brickTex} roughness={0.88} metalness={0} />
      </mesh>

      {/* Right panel (right of right window) */}
      <mesh position={[6.8, 0, -8.0]}>
        <boxGeometry args={[2.4, 2.4, 0.14]} />
        <meshStandardMaterial map={brickTex} roughness={0.88} metalness={0} />
      </mesh>

      {/* ── Left display window bay ─────────────────────────────────────── */}
      <group position={[-2.8, 0.1, -8.0]}>
        {/* Window frame — dark walnut */}
        <mesh>
          <boxGeometry args={[2.5, 2.5, 0.18]} />
          <meshStandardMaterial color="#3D2A1A" roughness={0.82} metalness={0} />
        </mesh>
        {/* Glass pane — clearcoat, warm interior color showing through */}
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.15, 2.15]} />
          <meshPhysicalMaterial
            color="#FFD08A"
            roughness={0.05}
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            opacity={0.22}
            transparent
          />
        </mesh>
        {/* Apothecary jar silhouettes visible inside — warm silhouettes */}
        {([-0.5, 0, 0.5] as const).map((x, i) => (
          <group key={`jar-sil-L-${i}`} position={[x, -0.5, 0.05]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.16, 0.6, 12]} />
              <meshStandardMaterial color="#8B5A2B" roughness={0.5} opacity={0.7} transparent />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <sphereGeometry args={[0.16, 10, 6]} />
              <meshStandardMaterial color="#7A4A20" roughness={0.6} opacity={0.7} transparent />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Center door bay ──────────────────────────────────────────────── */}
      <group position={[0, -0.1, -8.0]}>
        {/* Door frame — dark walnut */}
        <mesh>
          <boxGeometry args={[1.7, 2.6, 0.18]} />
          <meshStandardMaterial color="#3D2A1A" roughness={0.82} metalness={0} />
        </mesh>
        {/* Door panel recessed slightly */}
        <mesh position={[0, -0.2, 0.08]}>
          <boxGeometry args={[1.28, 1.85, 0.05]} />
          <meshStandardMaterial color="#5A3A1A" roughness={0.78} metalness={0} />
        </mesh>
        {/* Door panel inset details (two raised rectangles) */}
        <mesh position={[0, 0.15, 0.11]}>
          <boxGeometry args={[1.0, 0.7, 0.03]} />
          <meshStandardMaterial color="#6A4822" roughness={0.8} metalness={0} />
        </mesh>
        <mesh position={[0, -0.55, 0.11]}>
          <boxGeometry args={[1.0, 0.55, 0.03]} />
          <meshStandardMaterial color="#6A4822" roughness={0.8} metalness={0} />
        </mesh>
        {/* Small window panes at top of door */}
        <mesh position={[-0.27, 0.75, 0.1]}>
          <boxGeometry args={[0.44, 0.38, 0.04]} />
          <meshPhysicalMaterial
            color="#FFD08A"
            roughness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            opacity={0.35}
            transparent
          />
        </mesh>
        <mesh position={[0.27, 0.75, 0.1]}>
          <boxGeometry args={[0.44, 0.38, 0.04]} />
          <meshPhysicalMaterial
            color="#FFD08A"
            roughness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            opacity={0.35}
            transparent
          />
        </mesh>
        {/* Brass kick-plate */}
        <mesh position={[0, -1.14, 0.13]}>
          <boxGeometry args={[1.28, 0.28, 0.03]} />
          <meshStandardMaterial color="#9C7A3C" roughness={0.35} metalness={0.75} />
        </mesh>
        {/* Brass door handle */}
        <mesh position={[0.42, -0.1, 0.14]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 10]} />
          <meshStandardMaterial color="#B8943C" roughness={0.25} metalness={0.85} />
        </mesh>
      </group>

      {/* ── Right display window bay ─────────────────────────────────────── */}
      <group position={[2.8, 0.1, -8.0]}>
        {/* Window frame — dark walnut */}
        <mesh>
          <boxGeometry args={[2.5, 2.5, 0.18]} />
          <meshStandardMaterial color="#3D2A1A" roughness={0.82} metalness={0} />
        </mesh>
        {/* Glass pane */}
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.15, 2.15]} />
          <meshPhysicalMaterial
            color="#FFD08A"
            roughness={0.05}
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            opacity={0.22}
            transparent
          />
        </mesh>
        {/* Soda fountain silhouette — tall chrome dispenser */}
        <mesh position={[0, -0.3, 0.05]}>
          <cylinderGeometry args={[0.12, 0.18, 0.9, 14]} />
          <meshStandardMaterial color="#C8C8C8" roughness={0.2} metalness={0.8} opacity={0.7} transparent />
        </mesh>
        <mesh position={[0, 0.22, 0.05]}>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color="#D2D6D2" roughness={0.15} metalness={0.85} opacity={0.7} transparent />
        </mesh>
      </group>

      {/* ── Burgund awning ───────────────────────────────────────────────── */}
      <group position={[0, 1.2, -7.75]}>
        {/* Awning top surface */}
        <mesh rotation={[0.18, 0, 0]}>
          <boxGeometry args={[7.2, 0.18, 1.0]} />
          <meshStandardMaterial map={awningTex} roughness={0.7} metalness={0} />
        </mesh>
        {/* Awning front valance (scalloped trim face) */}
        <mesh position={[0, -0.1, 0.52]}>
          <boxGeometry args={[7.2, 0.22, 0.04]} />
          <meshStandardMaterial map={awningTex} roughness={0.7} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Gold-leaf signage on awning face ────────────────────────────── */}
      <Text
        position={[0, 1.28, -7.6]}
        fontSize={0.32}
        color="#D4A847"
        anchorX="center"
        anchorY="middle"
        font={undefined}
        outlineWidth={0.008}
        outlineColor="#1A1000"
        letterSpacing={0.06}
      >
        JACOBS&apos; PHARMACY
      </Text>

      {/* ── Smaller subtitle line ────────────────────────────────────────── */}
      <Text
        position={[0, 0.72, -7.85]}
        fontSize={0.16}
        color="#F1E9DA"
        anchorX="center"
        anchorY="middle"
        font={undefined}
        letterSpacing={0.12}
        outlineWidth={0.005}
        outlineColor="#1A1000"
      >
        SODA · FOUNTAIN · DRUGS
      </Text>

      {/* ── Sidewalk — cobblestone plane in front of building ───────────── */}
      <mesh
        position={[0, -1.0, -5.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[18, 7]} />
        <meshStandardMaterial map={cobbleTex} roughness={0.92} metalness={0} />
      </mesh>

      {/* ── Street plane (extends further forward) ──────────────────────── */}
      <mesh
        position={[0, -1.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#3A3530" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── Gas street lamp at x=+5 ──────────────────────────────────────── */}
      <group position={[5, -1.0, -6.5]}>
        {/* Pole */}
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 3.2, 10]} />
          <meshStandardMaterial color="#4A3820" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Lamp head */}
        <group position={[0, 3.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.22, 14, 10]} />
            <meshStandardMaterial color="#9C7A3C" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* Emissive bulb */}
          <mesh>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial
              color="#FFE4A0"
              emissive="#FFE4A0"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
          <pointLight color="#FFE0A0" intensity={0.5} distance={4} decay={1.5} />
        </group>
      </group>

      {/* ── Building corners / returns (make facade 3d, not flat card) ───── */}
      {/* Left return wall */}
      <mesh position={[-8.0, 2.5, -11.0]}>
        <boxGeometry args={[0.2, 7, 4]} />
        <meshStandardMaterial color="#6A2218" roughness={0.9} metalness={0} />
      </mesh>

      {/* Right return wall */}
      <mesh position={[8.0, 2.5, -11.0]}>
        <boxGeometry args={[0.2, 7, 4]} />
        <meshStandardMaterial color="#6A2218" roughness={0.9} metalness={0} />
      </mesh>

      {/* Roof parapet */}
      <mesh position={[0, 6.2, -9.0]}>
        <boxGeometry args={[16.4, 0.5, 2.2]} />
        <meshStandardMaterial color="#5A2010" roughness={0.85} metalness={0} />
      </mesh>

    </group>
  );
}
