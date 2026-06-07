/**
 * JacobsPharmacy — Jacobs' Pharmacy 1886 diegetic environment around the
 * vending machine. Mounted inside machine-hub so it inherits the machine
 * envelope visibility (hidden during chapter views).
 *
 * Elements:
 *   1. Dark wood plank floor
 *   2. Vertical-paneled back wall + brass chair rail
 *   3. Two apothecary shelves with 12 instanced period jars (4 InstancedMesh)
 *   4. Marble soda-fountain counter with chrome jar + cream straws
 *   5. Brass pendant lamp + diegetic pointLight
 *   6. Framed period advertisement on back wall
 *
 * Rules:
 *   - No transmission materials.
 *   - All CanvasTextures baked once in useMemo, disposed in useEffect cleanup.
 *   - InstancedMesh for jar bodies + caps, per-instance colors via setColorAt.
 */
import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';

// ---------------------------------------------------------------------------
// Period color palette for apothecary jars (index modulo 4)
// ---------------------------------------------------------------------------
const JAR_COLORS = ['#B8804A', '#1A2D5C', '#E5D5B0', '#2E4F3A'] as const;

// ---------------------------------------------------------------------------
// CanvasTexture factories — called once inside useMemo
// ---------------------------------------------------------------------------

function buildFloorTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Base dark brown fill
  ctx.fillStyle = '#3A2A1A';
  ctx.fillRect(0, 0, W, H);

  // 6 horizontal plank stripes with slightly varying shades
  const plankColors = ['#3D2C1C', '#4A3520', '#352618', '#3F2E1F', '#42301E', '#3A2A1A'];
  const plankH = Math.floor(H / 6);
  plankColors.forEach((color, i) => {
    const y = i * plankH;
    ctx.fillStyle = color;
    ctx.fillRect(0, y, W, plankH);

    // Subtle horizontal grain noise within each plank
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let g = 0; g < 30; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = Math.random() > 0.5 ? '#5A3D20' : '#1A0E06';
      ctx.lineWidth = 0.5 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }
    ctx.restore();

    // Thin dark grout line at bottom of each plank
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(0, y + plankH - 2, W, 3);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildWallTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Upper 40% — painted dark band
  ctx.fillStyle = '#2A1A0E';
  ctx.fillRect(0, 0, W, Math.floor(H * 0.4));

  // Lower 60% — vertical wood paneling in dark walnut
  const panelY = Math.floor(H * 0.4);
  const panelH = H - panelY;
  ctx.fillStyle = '#3D2A1A';
  ctx.fillRect(0, panelY, W, panelH);

  // 12 narrow vertical planks across the width
  const plankW = Math.floor(W / 12);
  for (let i = 0; i < 12; i++) {
    const x = i * plankW;

    // Vary shade slightly
    const shift = (i % 3) * 8;
    ctx.fillStyle = `rgb(${61 + shift}, ${42 + shift}, ${26 + shift})`;
    ctx.fillRect(x + 1, panelY, plankW - 1, panelH);

    // Subtle vertical grain lines within plank
    ctx.save();
    ctx.globalAlpha = 0.07;
    for (let g = 0; g < 12; g++) {
      const gx = x + 2 + Math.random() * (plankW - 4);
      ctx.strokeStyle = Math.random() > 0.5 ? '#5A3D20' : '#1A0E06';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, panelY);
      ctx.lineTo(gx + (Math.random() - 0.5) * 4, panelY + panelH);
      ctx.stroke();
    }
    ctx.restore();

    // Dark vertical seam line
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(x, panelY, 2, panelH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildMarbleTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Cream base
  ctx.fillStyle = '#F1E9DA';
  ctx.fillRect(0, 0, W, H);

  // Veining: 6 irregular curves in drab gold/tan
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#8E7547';
  for (let v = 0; v < 6; v++) {
    ctx.lineWidth = 0.8 + Math.random() * 1.5;
    ctx.beginPath();
    const x0 = Math.random() * W;
    const y0 = Math.random() * H;
    ctx.moveTo(x0, y0);
    for (let s = 0; s < 4; s++) {
      const cpx = Math.random() * W;
      const cpy = Math.random() * H;
      const ex = Math.random() * W;
      const ey = Math.random() * H;
      ctx.bezierCurveTo(cpx, cpy, cpx + 20, cpy + 20, ex, ey);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Subtle grain noise
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let n = 0; n < 400; n++) {
    const nx = Math.random() * W;
    const ny = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? '#9E8560' : '#D8CDB8';
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildAdTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Cream background
  ctx.fillStyle = '#F1E9DA';
  ctx.fillRect(0, 0, W, H);

  // Red horizontal rules
  ctx.fillStyle = '#F40009';
  ctx.fillRect(0, 80, W, 10);
  ctx.fillRect(0, 555, W, 10);

  // "DELICIOUS" — bold serif, wide tracking
  ctx.fillStyle = '#F40009';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('DELICIOUS', W / 2, 175);

  // "Coca-Cola" — italic script feel
  ctx.font = 'italic bold 110px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#F40009';
  ctx.fillText('Coca-Cola', W / 2, 310);

  // "REFRESHING" — bold serif
  ctx.font = 'bold 64px Georgia, serif';
  ctx.letterSpacing = '6px';
  ctx.fillStyle = '#F40009';
  ctx.fillText('REFRESHING', W / 2, 440);

  // Decorative dots around Coca-Cola
  ctx.fillStyle = '#F40009';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.letterSpacing = '0px';
  ctx.fillText('· · ·', W / 2, 375);

  // "5¢ AT ALL FOUNTAINS"
  ctx.fillStyle = '#2A1A08';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('5¢  AT ALL FOUNTAINS', W / 2, 600);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// InstancedMesh helpers
// ---------------------------------------------------------------------------

const _m4 = new THREE.Matrix4();
const _col = new THREE.Color();

function setJarInstances(
  mesh: THREE.InstancedMesh,
  shelfPositions: Array<{ x: number; y: number; z: number }>,
): void {
  shelfPositions.forEach(({ x, y, z }, i) => {
    _m4.setPosition(x, y, z);
    mesh.setMatrixAt(i, _m4);
    _col.set(JAR_COLORS[i % 4]);
    mesh.setColorAt(i, _col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JacobsPharmacy() {
  // Textures — baked once, disposed on unmount
  const { floorTex, wallTex, marbleTex, adTex } = useMemo(() => ({
    floorTex: buildFloorTexture(),
    wallTex: buildWallTexture(),
    marbleTex: buildMarbleTexture(),
    adTex: buildAdTexture(),
  }), []);

  useEffect(() => {
    return () => {
      floorTex.dispose();
      wallTex.dispose();
      marbleTex.dispose();
      adTex.dispose();
    };
  }, [floorTex, wallTex, marbleTex, adTex]);

  // InstancedMesh refs — lower shelf bodies, upper shelf bodies, lower caps, upper caps
  const lowerBodiesRef = useRef<THREE.InstancedMesh>(null);
  const upperBodiesRef = useRef<THREE.InstancedMesh>(null);
  const lowerCapsRef = useRef<THREE.InstancedMesh>(null);
  const upperCapsRef = useRef<THREE.InstancedMesh>(null);

  // Build jar positions for each shelf
  const lowerShelfY = 1.4;
  const upperShelfY = 2.6;
  const shelfZ = -4.6;

  const lowerBodyPositions = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: -1.8 + i * 0.72,
      y: lowerShelfY + 0.21,
      z: shelfZ,
    })), []);

  const upperBodyPositions = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: -1.8 + i * 0.72,
      y: upperShelfY + 0.21,
      z: shelfZ,
    })), []);

  const lowerCapPositions = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: -1.8 + i * 0.72,
      y: lowerShelfY + 0.45,
      z: shelfZ,
    })), []);

  const upperCapPositions = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: -1.8 + i * 0.72,
      y: upperShelfY + 0.45,
      z: shelfZ,
    })), []);

  // Apply instance transforms + colors after first render
  useEffect(() => {
    if (lowerBodiesRef.current) setJarInstances(lowerBodiesRef.current, lowerBodyPositions);
    if (upperBodiesRef.current) setJarInstances(upperBodiesRef.current, upperBodyPositions);

    // Caps share a dark wood color — no per-instance color variation needed,
    // but we still need to set the matrices.
    [lowerCapsRef, upperCapsRef].forEach((ref, si) => {
      const positions = si === 0 ? lowerCapPositions : upperCapPositions;
      const mesh = ref.current;
      if (!mesh) return;
      positions.forEach(({ x, y, z }, i) => {
        _m4.setPosition(x, y, z);
        mesh.setMatrixAt(i, _m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [lowerBodyPositions, upperBodyPositions, lowerCapPositions, upperCapPositions]);

  return (
    <group name="jacobs-pharmacy">

      {/* ── 1. Dark wood plank floor ──────────────────────────────────── */}
      <mesh
        position={[0, -3.0, -1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} metalness={0} />
      </mesh>

      {/* Local contact shadows for the machine — anchored just above the wood
          plank floor so the machine reads as standing on the planks, not
          floating above the scene-root's y=-1.45 shadow plane. */}
      <ContactShadows
        position={[0, -2.95, -1.5]}
        opacity={0.65}
        blur={2.4}
        far={3.5}
        resolution={512}
      />

      {/* ── 2. Back wall (vertical paneling) ─────────────────────────── */}
      <mesh position={[0, 0.5, -5.0]} receiveShadow>
        <planeGeometry args={[12, 7]} />
        <meshStandardMaterial map={wallTex} roughness={0.75} metalness={0} />
      </mesh>

      {/* Brass chair-rail molding at y=0.5 */}
      <mesh position={[0, 0.5, -4.95]}>
        <boxGeometry args={[12, 0.10, 0.08]} />
        <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* ── 3. Apothecary shelves ─────────────────────────────────────── */}
      {/* Lower shelf plank */}
      <mesh position={[0, lowerShelfY, shelfZ]}>
        <boxGeometry args={[5, 0.05, 0.4]} />
        <meshStandardMaterial color="#3D2A1A" roughness={0.85} metalness={0} />
      </mesh>

      {/* Upper shelf plank */}
      <mesh position={[0, upperShelfY, shelfZ]}>
        <boxGeometry args={[5, 0.05, 0.4]} />
        <meshStandardMaterial color="#3D2A1A" roughness={0.85} metalness={0} />
      </mesh>

      {/* Lower shelf — jar bodies (InstancedMesh, 6 instances) */}
      <instancedMesh ref={lowerBodiesRef} args={[undefined, undefined, 6]}>
        <cylinderGeometry args={[0.16, 0.18, 0.42, 16]} />
        <meshStandardMaterial roughness={0.4} metalness={0.05} vertexColors />
      </instancedMesh>

      {/* Upper shelf — jar bodies */}
      <instancedMesh ref={upperBodiesRef} args={[undefined, undefined, 6]}>
        <cylinderGeometry args={[0.16, 0.18, 0.42, 16]} />
        <meshStandardMaterial roughness={0.4} metalness={0.05} vertexColors />
      </instancedMesh>

      {/* Lower shelf — jar caps */}
      <instancedMesh ref={lowerCapsRef} args={[undefined, undefined, 6]}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
        <meshStandardMaterial color="#5A3A20" roughness={0.5} metalness={0.3} />
      </instancedMesh>

      {/* Upper shelf — jar caps */}
      <instancedMesh ref={upperCapsRef} args={[undefined, undefined, 6]}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
        <meshStandardMaterial color="#5A3A20" roughness={0.5} metalness={0.3} />
      </instancedMesh>

      {/* ── 4. Marble soda-fountain counter ──────────────────────────── */}
      <group position={[3.5, -2.0, -1.5]}>
        {/* Counter base — dark wood */}
        <mesh>
          <boxGeometry args={[2.2, 1.4, 1.1]} />
          <meshStandardMaterial color="#3D2A1A" roughness={0.85} metalness={0} />
        </mesh>

        {/* Marble top surface */}
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[2.3, 0.06, 1.2]} />
          <meshStandardMaterial map={marbleTex} roughness={0.3} metalness={0.05} />
        </mesh>

        {/* Brass trim strip along front top edge */}
        <mesh position={[0, 0.69, 0.6]}>
          <boxGeometry args={[2.3, 0.03, 0.05]} />
          <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Chrome apothecary jar of straws on the counter top */}
        <group position={[0.5, 1.0, 0]}>
          {/* Jar body — chrome */}
          <mesh>
            <cylinderGeometry args={[0.18, 0.20, 0.55, 20]} />
            <meshStandardMaterial color="#D2D6D2" roughness={0.18} metalness={0.85} />
          </mesh>
          {/* 5 cream straws sticking out at slight tilts */}
          {([-0.08, -0.04, 0, 0.04, 0.08] as const).map((x, i) => (
            <mesh key={i} position={[x, 0.45, 0]} rotation={[0, 0, 0.04 * (i - 2)]}>
              <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
              <meshStandardMaterial color="#F1E9DA" roughness={0.7} metalness={0} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── 5. Brass pendant lamp with diegetic point light ──────────── */}
      <group position={[0, 4.5, 0]}>
        {/* Cord descending from off-screen ceiling */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
          <meshStandardMaterial color="#1A1208" roughness={0.9} metalness={0} />
        </mesh>

        {/* Brass dome shade */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#9C7A3C"
            roughness={0.35}
            metalness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner bulb emissive glow — visible warm light through shade opening */}
        <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#FFE4A0"
            emissive="#FFE4A0"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>

        {/* Diegetic point light — justifies scene warming from above */}
        <pointLight
          position={[0, -0.3, 0]}
          color="#FFE4A0"
          intensity={0.8}
          distance={5}
          decay={1.5}
        />
      </group>

      {/* ── 6. Framed period advertisement ───────────────────────────── */}
      <group position={[0, 3.5, -4.9]}>
        {/* Brass frame */}
        <mesh>
          <boxGeometry args={[1.7, 1.1, 0.06]} />
          <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Recessed advertisement plane — slightly proud of frame face */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.5, 0.92]} />
          <meshBasicMaterial map={adTex} toneMapped={false} />
        </mesh>
      </group>

    </group>
  );
}
