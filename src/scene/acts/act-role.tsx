import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Act 1 — Role: vintage 1950s Coca-Cola advertising print in a chrome shadow-box frame.
// Museum lighting from above; slowly rotates on a gentle ease.
// No transmission materials (perf rule). Glass reads via clearcoat + HDR reflection only.

const CREAM = '#F1E9DA';
const CHROME = '#C8C4BC';
const BRASS = '#B89668';
const BRASS_TEXT = '#3A2406';
const VELVET = '#0A0203';
const SPOTLIGHT_CREAM = '#FFF6E0';

// ---------- Procedural poster CanvasTexture ----------

function buildPosterTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Cream background
  ctx.fillStyle = '#F1E9DA';
  ctx.fillRect(0, 0, W, H);

  // Subtle aged paper texture — light diagonal hatching
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = '#8B6A50';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();

  // Outer border — thin red rule
  const BORDER = 28;
  ctx.strokeStyle = '#F40009';
  ctx.lineWidth = 8;
  ctx.strokeRect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);

  // Inner thin cream rule inside red border
  ctx.strokeStyle = '#F1E9DA';
  ctx.lineWidth = 2;
  ctx.strokeRect(BORDER + 12, BORDER + 12, W - (BORDER + 12) * 2, H - (BORDER + 12) * 2);

  // ---- TOP BANNER: "DRINK" ----
  const TOP_BANNER_Y = 54;
  const TOP_BANNER_H = 200;
  ctx.fillStyle = '#F40009';
  ctx.fillRect(BORDER + 1, TOP_BANNER_Y, W - (BORDER + 1) * 2, TOP_BANNER_H);

  // "DRINK" — cream block-caps, heavy weight
  ctx.save();
  ctx.font = 'bold 148px "Arial Black", "Impact", sans-serif';
  ctx.fillStyle = '#F1E9DA';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Drop shadow for "extruded" feeling
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 0;
  ctx.fillText('DRINK', W / 2, TOP_BANNER_Y + TOP_BANNER_H / 2);
  ctx.restore();

  // ---- MIDDLE AREA: stylized contour bottle silhouette ----
  const MID_TOP = TOP_BANNER_Y + TOP_BANNER_H + 24;
  const BOT_BANNER_TOP = H - 54 - 200 - 24;
  const MID_H = BOT_BANNER_TOP - MID_TOP;
  const midCX = W / 2;
  const midCY = MID_TOP + MID_H / 2;

  // Light vignette oval behind bottle
  const grad = ctx.createRadialGradient(midCX, midCY, 40, midCX, midCY, 310);
  grad.addColorStop(0, 'rgba(244,0,9,0.10)');
  grad.addColorStop(1, 'rgba(241,233,218,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, MID_TOP, W, MID_H);

  // Draw a simple Coca-Cola contour bottle silhouette using paths
  drawBottleSilhouette(ctx, midCX, midCY, 155);

  // ---- BOTTOM BANNER: "COCA-COLA" ----
  const BOT_BANNER_Y = BOT_BANNER_TOP;
  const BOT_BANNER_H = 200;
  ctx.fillStyle = '#F40009';
  ctx.fillRect(BORDER + 1, BOT_BANNER_Y, W - (BORDER + 1) * 2, BOT_BANNER_H);

  // "COCA-COLA" — Pacifico-style; fall back to serif for canvas
  ctx.save();
  ctx.font = 'bold italic 88px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#F1E9DA';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 0;
  ctx.fillText('Coca-Cola', W / 2, BOT_BANNER_Y + BOT_BANNER_H / 2);
  ctx.restore();

  // ---- TAGLINE: "DELICIOUS · REFRESHING" ----
  const TAGLINE_Y = BOT_BANNER_Y + BOT_BANNER_H + 16;
  ctx.save();
  ctx.font = '500 22px "Arial", sans-serif';
  ctx.fillStyle = '#8B6A50';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '0.25em'; // note: only supported in modern browsers; fallback is fine
  ctx.fillText('DELICIOUS  ·  REFRESHING', W / 2, TAGLINE_Y);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// Simple contour-bottle silhouette drawn with canvas arc/bezier paths
function drawBottleSilhouette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
) {
  // Bottle defined relative to center; coords in normalized units, scaled up.
  // Shape: classic Hobble-skirt / contour profile
  const s = scale;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  // Start at top-center (bottle mouth)
  ctx.moveTo(0, -s * 1.0);
  // Neck top opening
  ctx.bezierCurveTo(s * 0.08, -s * 1.0, s * 0.10, -s * 0.85, s * 0.10, -s * 0.8);
  // Neck shaft
  ctx.bezierCurveTo(s * 0.10, -s * 0.72, s * 0.16, -s * 0.65, s * 0.22, -s * 0.55);
  // Shoulder flare
  ctx.bezierCurveTo(s * 0.38, -s * 0.3, s * 0.42, -s * 0.18, s * 0.38, 0.0);
  // Body bulge (contour shape)
  ctx.bezierCurveTo(s * 0.35, s * 0.18, s * 0.42, s * 0.36, s * 0.40, s * 0.52);
  // Waist
  ctx.bezierCurveTo(s * 0.36, s * 0.66, s * 0.28, s * 0.70, s * 0.28, s * 0.74);
  // Base flare
  ctx.bezierCurveTo(s * 0.28, s * 0.82, s * 0.36, s * 0.88, s * 0.36, s * 0.96);
  // Bottom
  ctx.bezierCurveTo(s * 0.36, s * 0.99, s * 0.20, s * 1.0, 0, s * 1.0);
  // Mirror left side
  ctx.bezierCurveTo(-s * 0.20, s * 1.0, -s * 0.36, s * 0.99, -s * 0.36, s * 0.96);
  ctx.bezierCurveTo(-s * 0.36, s * 0.88, -s * 0.28, s * 0.82, -s * 0.28, s * 0.74);
  ctx.bezierCurveTo(-s * 0.28, s * 0.70, -s * 0.36, s * 0.66, -s * 0.40, s * 0.52);
  ctx.bezierCurveTo(-s * 0.42, s * 0.36, -s * 0.35, s * 0.18, -s * 0.38, 0.0);
  ctx.bezierCurveTo(-s * 0.42, -s * 0.18, -s * 0.38, -s * 0.3, -s * 0.22, -s * 0.55);
  ctx.bezierCurveTo(-s * 0.16, -s * 0.65, -s * 0.10, -s * 0.72, -s * 0.10, -s * 0.8);
  ctx.bezierCurveTo(-s * 0.10, -s * 0.85, -s * 0.08, -s * 1.0, 0, -s * 1.0);
  ctx.closePath();

  // Fill with cream, semi-transparent for vintage-print feel
  ctx.fillStyle = 'rgba(241, 233, 218, 0.55)';
  ctx.fill();

  // Stroke outline — slightly darker cream / antique
  ctx.strokeStyle = 'rgba(160, 120, 80, 0.60)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Highlight stripe down left of bottle body
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, -s * 0.4);
  ctx.bezierCurveTo(-s * 0.18, 0, -s * 0.22, s * 0.3, -s * 0.16, s * 0.65);
  ctx.strokeStyle = 'rgba(255,248,235,0.35)';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.restore();
}

// ---------- Component ----------

export function ActRole() {
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef(false);

  // Bake the poster texture once — no re-render on every frame
  const posterTexture = useMemo(() => buildPosterTexture(), []);

  // Dispose texture when component unmounts
  useEffect(() => () => posterTexture.dispose(), [posterTexture]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const envelope = mixesRef.current.role;
    const active = envelope > 0.002;

    g.visible = active;

    if (!active) {
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }

    // Entrance: dive in from z=1.5, scale up
    g.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    g.scale.setScalar(0.5 + 0.5 * envelope);

    if (reduced) {
      // Parked at a slight ~2° tilt; no animation
      g.rotation.y = (2 * Math.PI) / 180;
      g.position.y = 0;
      return;
    }

    const elapsed = clock.elapsedTime;
    const isHovered = hoveredRef.current;

    // Y rotation: gentle sine swing — hover accelerates frequency
    const freq = isHovered ? 0.7 : 0.4;
    g.rotation.y = 0.04 * Math.sin(elapsed * freq);

    // Subtle bob
    const bobAmp = isHovered ? 0.07 : 0.04;
    g.position.y = bobAmp * Math.sin(elapsed * 0.55);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Museum spotlight from above — cream tint, casts onto frame + shadow plane */}
      <spotLight
        position={[0, 3.5, 2]}
        target-position={[0, 0, 0]}
        intensity={4.0}
        color={SPOTLIGHT_CREAM}
        angle={0.55}
        penumbra={0.6}
        distance={8}
        castShadow={false}
      />

      {/* Shadow-box frame — chrome RoundedBox */}
      <RoundedBox
        args={[2.2, 2.8, 0.18]}
        radius={0.04}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
          document.body.style.cursor = '';
        }}
      >
        <meshStandardMaterial
          color={CHROME}
          roughness={0.18}
          metalness={0.88}
        />
      </RoundedBox>

      {/* Black velvet inner backing */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[2.0, 2.6, 0.01]} />
        <meshStandardMaterial color={VELVET} roughness={0.85} />
      </mesh>

      {/* Poster artwork — procedural CanvasTexture */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[1.85, 2.45]} />
        <meshStandardMaterial
          map={posterTexture}
          roughness={0.55}
          metalness={0}
        />
      </mesh>

      {/* Glass cover — clearcoat, NO transmission */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[2.0, 2.6, 0.005]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={0.12}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Brass nameplate — bottom of frame face */}
      <mesh position={[0, -1.32, 0.10]}>
        <boxGeometry args={[0.7, 0.16, 0.02]} />
        <meshStandardMaterial color={BRASS} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Nameplate text */}
      <Text
        position={[0, -1.32, 0.115]}
        fontSize={0.042}
        color={BRASS_TEXT}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
        font={undefined}
      >
        GLOBAL HUMAN INSIGHTS
      </Text>
    </group>
  );
}
