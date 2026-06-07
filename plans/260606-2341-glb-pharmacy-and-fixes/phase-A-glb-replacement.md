# Phase A — Replace procedural exterior + interior with GLBs

**Files owned:**
- `src/scene/brand/brick-shop-building-gltf.tsx` (NEW)
- `src/scene/brand/convenience-store-gltf.tsx` (NEW)
- `src/scene/jacobs-pharmacy-exterior.tsx` (gut + replace with wrapper)
- `src/scene/jacobs-pharmacy.tsx` (gut + replace with wrapper)
- `src/scene/camera-rig.tsx` (small edit — refit exterior pose to the new GLB)

## Why

User: *"the inside of the store is horrendous"* + provided two GLBs (`brick-shop-building.glb`, `convenience-store-interior.glb`). The procedural exterior + interior we've iterated through were the wrong direction — real assets at low-poly quality beat our procedural geometry.

## Assets

- Exterior: `public/assets/models/brick-shop-building.glb` (2.5 MB) — already copied
- Interior: `public/assets/models/convenience-store-interior.glb` (12 MB) — already copied

## Tasks

### 1. New component: `src/scene/brand/brick-shop-building-gltf.tsx`

A loader component for the brick shop building GLB. Stays focused on the loading + normalization concerns; pose/positioning is handled by the consumer.

```tsx
import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BUILDING_URL = '/assets/models/brick-shop-building.glb';
useGLTF.preload(BUILDING_URL);

/**
 * Target visible height for the building when scale=1, in world units.
 * Roughly the height of a 3-4 story Victorian commercial building.
 */
const TARGET_HEIGHT = 6.0;

interface BrickShopBuildingProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Multiplier on top of the auto-normalized scale. */
  scale?: number;
}

export function BrickShopBuilding({ position, rotation, scale = 1 }: BrickShopBuildingProps) {
  const { scene } = useGLTF(BUILDING_URL);

  // Clone once per instance — multiple buildings on the block share the GLB
  // source but get independent scene graphs so per-instance transforms work.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box, derive a normalization factor so building height
  // matches TARGET_HEIGHT, and translate so the base sits at local y=0.
  const { normalizedScale, originOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const factor = size.y > 1e-4 ? TARGET_HEIGHT / size.y : 1;
    const offsetY = -box.min.y * factor;
    return {
      normalizedScale: factor,
      originOffset: new THREE.Vector3(-center.x * factor, offsetY, -center.z * factor),
    };
  }, [cloned]);

  // Dispose per-instance geometries/materials on unmount; shared scene from
  // useGLTF stays cached by drei.
  useEffect(
    () => () => {
      cloned.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
    },
    [cloned],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group scale={normalizedScale} position={originOffset.toArray() as [number, number, number]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
```

### 2. New component: `src/scene/brand/convenience-store-gltf.tsx`

Same pattern, different target height. The interior model wraps around the camera + vending machine; target height ~6 (interior room).

```tsx
const STORE_URL = '/assets/models/convenience-store-interior.glb';
useGLTF.preload(STORE_URL);

const TARGET_HEIGHT = 6.0;
```

Same prop shape (`position`, `rotation`, `scale`). Same normalization. Same disposal.

### 3. Gut `src/scene/jacobs-pharmacy-exterior.tsx`

Drop ALL procedural geometry: brick facade, storefront bays, awning, signage, sidewalk, gas lamp, interior glow, framed ad, etc. Replace the entire component body with a wrapper that mounts the `BrickShopBuilding` GLB and constructs a corner-block feel by placing 2-3 instances:

```tsx
import { BrickShopBuilding } from './brand/brick-shop-building-gltf';
import { useNavigation } from './navigation-context';

export function JacobsPharmacyExterior() {
  const { view, entering } = useNavigation();

  return (
    <group name="jacobs-pharmacy-exterior" visible={view === 'exterior' || entering}>
      {/* Primary corner building — the pharmacy itself, fronting the camera */}
      <BrickShopBuilding
        position={[0, -3.0, -4.0]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />

      {/* Neighboring building rotated 90° — establishes the corner block */}
      <BrickShopBuilding
        position={[5.5, -3.0, -4.5]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={1.0}
      />

      {/* Distant building down the street — smaller scale, atmospheric perspective */}
      <BrickShopBuilding
        position={[-7.0, -3.0, -6.5]}
        rotation={[0, Math.PI / 8, 0]}
        scale={0.85}
      />

      {/* Single warm street-lamp glow at the storefront door */}
      <pointLight color="#FFE4A0" intensity={1.4} position={[0, 0.5, -2.5]} distance={4} decay={1.5} />
    </group>
  );
}
```

Final positioning numbers may need adjusting at integration — INSPECT the GLB's bbox at first render (a one-time `console.log` is fine; remove before commit) and tune so:
- The pharmacy building's corner is visible at the exterior camera framing
- The two side buildings frame the camera view (forming an L-shape corner block)
- The ground floor of the pharmacy is at camera eye-level

If the loaded GLB is too small or too large relative to expectations, adjust the `TARGET_HEIGHT` in the loader component or per-instance `scale`.

### 4. Gut `src/scene/jacobs-pharmacy.tsx` (interior)

Replace ALL procedural interior content: wood plank floor, vertical-panel back wall, brass chair-rail, apothecary shelves, instanced jars, marble soda-fountain counter with straws, brass pendant lamp, framed advert, local ContactShadows, brass plaque on the crate. All goes away.

Replace with a thin wrapper that mounts the `ConvenienceStore` GLB:

```tsx
import { ConvenienceStore } from './brand/convenience-store-gltf';

export function JacobsPharmacy() {
  return (
    <group name="jacobs-pharmacy-interior">
      {/* The convenience store interior GLB — wraps around the vending machine. */}
      {/* Positioned so the floor sits at y=-3 and the camera looks toward the
          machine which sits inside this space. */}
      <ConvenienceStore
        position={[0, -3.0, -2.0]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />

      {/* Local contact shadows under the vending machine so it reads as sitting
          on the store floor. */}
      <ContactShadows
        position={[0, -2.95, -1.0]}
        opacity={0.5}
        blur={2.4}
        far={3.5}
        resolution={512}
      />
    </group>
  );
}
```

Note: the existing `<JacobsPharmacy />` component is mounted INSIDE `machine-hub.tsx` (which gates it on the machine envelope). Keep that. The interior should ONLY be visible during the `'machine'` view; the inherited visibility from machine-hub handles that.

The brass plaque tidbit `FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS` was painted onto the procedural crate — that crate is gone now (the new GLB has its own props). For this round, accept losing the tidbit; we'll re-add it as a sign/poster in a follow-up round if it matters.

### 5. Adjust `src/scene/camera-rig.tsx` exterior pose

The procedural storefront was positioned with the camera at `position=(0, 1.8, 5.0)` looking at `(0, 1.8, -5.0)`. The new brick-shop GLB at `(0, -3.0, -4.0)` with base at y=0 (so the building extends from y=-3 to y=+3 in world coordinates after applying the position offset) needs different framing.

Pragmatic update: pull the camera back further and lower it slightly to frame the corner block:
- Position: `(0, 0.5, 7.5)` (5 → 7.5 back, 1.8 → 0.5 lower)
- Look at: `(0, 1.5, -4.0)` (focus on the building face)

Verify by running the dev server after Phase A lands.

### 6. Cross-cutting verifications

- `machine-hub.tsx` imports `<JacobsPharmacy />` (the interior) — confirm the import path stays valid after gutting.
- `app.tsx` imports `<JacobsPharmacyExterior />` — confirm.
- The procedural CanvasTexture builders that lived in the old files (brick, wall, marble, advert, plank, stencil) are deleted along with the procedural geometry. Don't leave stale builder functions.

### 7. DRACO compression check

The convenience-store GLB is 12 MB — could be Draco-compressed. If `npm run build` errors with "DRACOLoader required," configure once at module scope:

```ts
import { useGLTF } from '@react-three/drei';
useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
```

(The bottle GLB worked without this; check at build time.)

## Acceptance criteria

- Initial view shows the brick-shop GLB as the pharmacy building, with the camera framing showing the building corner clearly (not cut off).
- 2-3 building instances arranged as a corner block.
- Click "Enter the Pharmacy" → camera dollies into the machine view → the convenience-store GLB interior surrounds the vending machine.
- Procedural interior (shelves/counter/lamp/jars/advert) is completely gone.
- Procedural exterior (brick facade/awning/signage/sidewalk procedural) is completely gone.
- `npm run build` passes.
- No transmission materials.

## Out of scope

- Don't touch the bottle component or `bottle-gltf.tsx`.
- Don't touch the vending machine (Phase B owns the hover-lift change).
- Don't touch `scene-backdrop.tsx` (Phase B owns that).
- Don't add procedural buildings as fallback — the GLB is the source of truth.

## Verification

```bash
npm run dev
# Initial: corner-block exterior, no cut-off
# Click Enter: 1.6s dolly inside
# Interior: convenience-store GLB wraps machine, no procedural shelves/counter
```
