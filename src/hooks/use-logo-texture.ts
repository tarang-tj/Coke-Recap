import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Builds a CanvasTexture of the official Coca-Cola wordmark recolored to a
// flat color (default white) on a transparent background — for applying the
// real trademark onto 3-D surfaces (bottle labels, machine header) as a decal.
//
// The source SVG (red paths on transparent) is drawn, then `source-in`
// compositing repaints every opaque pixel with `color`, yielding a clean
// white wordmark that reads on the red bottles.

const LOGO_SRC = '/brand/coca-cola-logo.svg';
const ASPECT = 192.94 / 615.08; // from the SVG viewBox

export function useLogoTexture(color = '#FFFEF6'): THREE.CanvasTexture {
  const texture = useMemo(() => {
    const w = 1024;
    const h = Math.round(w * ASPECT);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        tex.needsUpdate = true;
      };
      img.src = LOGO_SRC;
    }
    return tex;
  }, [color]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
