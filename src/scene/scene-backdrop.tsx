import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

// Red Coca-Cola "world" rendered INSIDE the scene as an inverted skydome.
// Why in-scene and not just a CSS background: the postprocessing EffectComposer
// outputs an opaque frame, so a transparent canvas over a CSS gradient renders
// black. Putting the gradient on a backside sphere makes it part of what the
// composer (and bloom/vignette) actually draws — so the world reads red.

function makeGradientTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  // Bright Coca-Cola red core fading to deep crimson / near-black at the edges.
  const g = ctx.createRadialGradient(size * 0.5, size * 0.42, 0, size * 0.5, size * 0.5, size * 0.62);
  g.addColorStop(0.0, '#F40009');
  g.addColorStop(0.4, '#C0091A');
  g.addColorStop(0.72, '#5A0A0E');
  g.addColorStop(1.0, '#2A0406');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function SceneBackdrop() {
  const texture = useMemo(makeGradientTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[45, 32, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}
