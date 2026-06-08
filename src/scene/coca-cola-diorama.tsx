/**
 * CocaColaDiorama — the single 3-D world.
 *
 * Loads the complete 1886 Five Points Atlanta diorama (Jacob's Pharmacy, the
 * full city block, the soda fountain, the Coca-Cola vending machine + crates,
 * the horse-drawn delivery wagon, the motorcar, chimney smoke, pedestrians,
 * birds, trees, and the skyline backdrop) from one GLB.
 *
 * The GLB is authored at real-world-ish scale with its base at world y≈0 and
 * the pharmacy facade facing -Z (the street side), so it is mounted at the
 * origin with no normalization — camera-rig poses are written in these same
 * world coordinates.
 *
 * Of the 30 baked clips, ONLY the chimney smoke plays. The vehicle bake (wagon,
 * car, and all their wheels) is broken — wheels spin off-axis — so those clips
 * are left stopped and the traffic reads as a still tableau. Smoke clips are
 * pure upward/opacity drifts with no axle rig, so they animate cleanly.
 *
 * GREEN-LOGO FIX. Every Coca-Cola decal (the motorcar ad, the round button
 * sign, etc.) shares one alpha-channel logo PNG, but each decal material was
 * baked with alphaMode OPAQUE. With OPAQUE, the texture's transparent region
 * isn't clipped — it renders as a solid (green-tinted) panel behind the script.
 * The fix is an alpha cutout (`alphaTest`) so only the opaque letters survive.
 * The letter colour then depends on what each decal sits on:
 *   - light/cream backings (the motorcar ad, the barrel label, the window
 *     poster) keep the baked red script.
 *   - red/dark backings (the round button, the vending machine, the storefront
 *     awning) would render red-on-red, so we re-tint those decals' letters white
 *     for the iconic red-ground / white-script Coca-Cola look.
 * The motorcar's dark-green `CarBody` frame is also recoloured to Coca-Cola red.
 * (The `Coke_ghost` mural lives on the rear facade, never on camera, so it is
 * left untouched.)
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useReducedMotion } from '../hooks/use-reduced-motion';

const DIORAMA_URL = '/assets/models/coca-cola-diorama.glb';

// Only clips whose name starts with this drive the smoke; everything else
// (WagonRig, CarRig, Wheel_*, Car_wheel*) stays stopped.
const SMOKE_PREFIX = 'Smoke';

// The car body was baked dark green; recolor it to the same Coca-Cola red used
// by the brand's `CokeRed` material so the side-panel logo loses its green frame.
const CAR_BODY_MATERIAL = 'CarBody';
const COKE_RED = '#bd0a0d'; // ≈ linear [0.74, 0.04, 0.05]

// Every Coca-Cola decal shares one alpha-channel logo PNG baked alphaMode
// OPAQUE, so each renders its transparent region as a solid green panel. All of
// them get the alpha cutout; the letter colour then depends on the backing.
//
// Light/cream backings keep the baked red script (the script reads against the
// pale panel as-is).
const RED_LETTER_DECALS = [
  'Car_ad_m', // motorcar side ad — cream backing
  'Barrel_lbl_m', // barrel/crate label — cream backing
  'Win_poster_m', // storefront window poster — light glass
];
// Red/dark backings would render red-on-red, so re-tint the letters white for
// the iconic red-ground / white-script look.
const WHITE_LETTER_DECALS = [
  'Btn_logo_m', // round button medallion — red disc
  'Vend_logo_m', // vending machine front — red body
  'Coke_fascia_m', // storefront awning fascia — red awning
];
// `Coke_ghost_m` (rear-facade mural) is intentionally omitted — it never faces
// the camera, so the OPAQUE green never shows.

// Turn a decal material into an alpha cutout: only fully-opaque texels (the
// letters) draw, the transparent green backdrop is discarded.
function applyAlphaCutout(m: THREE.MeshStandardMaterial) {
  m.alphaTest = 0.5;
  m.transparent = false;
  if (m.emissive) m.emissive.set(0, 0, 0);
  m.needsUpdate = true;
}

// Rebuild a decal's color map with every texel forced to white, preserving the
// alpha channel — yields white letters once cut out (for dark/red backings).
function whitenLetters(m: THREE.MeshStandardMaterial) {
  const src = m.map?.image as (HTMLImageElement | HTMLCanvasElement) | undefined;
  if (!src) return;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(src, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 255;
    data.data[i + 1] = 255;
    data.data[i + 2] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (m.map) {
    tex.flipY = m.map.flipY;
    tex.wrapS = m.map.wrapS;
    tex.wrapT = m.map.wrapT;
  }
  m.map = tex;
  if (m.color) m.color.set('#ffffff');
}

// Begin fetching the moment this module is imported.
useGLTF.preload(DIORAMA_URL);

export function CocaColaDiorama() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DIORAMA_URL);
  const { actions } = useAnimations(animations, group);
  const reduced = useReducedMotion();

  // De-green the Coca-Cola signage once per loaded scene. Materials may be
  // shared across meshes, so a Set guards against touching an instance twice.
  useMemo(() => {
    const seen = new Set<THREE.Material>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat || seen.has(mat)) return;
        const m = mat as THREE.MeshStandardMaterial;
        if (m.name === CAR_BODY_MATERIAL) {
          seen.add(m);
          if (m.color) m.color.set(COKE_RED);
        } else if (RED_LETTER_DECALS.includes(m.name)) {
          seen.add(m);
          applyAlphaCutout(m); // keep baked red script on the light backing
        } else if (WHITE_LETTER_DECALS.includes(m.name)) {
          seen.add(m);
          whitenLetters(m); // white script for the red/dark backing
          applyAlphaCutout(m);
        }
      });
    });
  }, [scene]);

  useEffect(() => {
    if (reduced) return;
    const smoke = Object.entries(actions)
      .filter(([name]) => name.startsWith(SMOKE_PREFIX))
      .map(([, action]) => action)
      .filter((a): a is THREE.AnimationAction => a !== null);

    smoke.forEach((action) => {
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    });

    return () => smoke.forEach((action) => action.stop());
  }, [actions, reduced]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}
