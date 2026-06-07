# Phase A — Bottle GLB pipeline + replace procedural everywhere

**Files owned:**
- `src/scene/brand/bottle-gltf.tsx` (NEW)
- `src/scene/acts/act-bottle.tsx` (modify)
- `src/scene/brand/vending-machine.tsx` (modify)
- `src/scene/acts/act-tools.tsx` (modify)

## Why

After seven rounds of procedural bottle iteration, the user provided a real Coca-Cola bottle GLB (4.6MB) at `public/assets/models/coca-cola-bottle.glb`. This is the right tool — GLB-baked materials, real silhouette, real wordmark texture. We adopt it as the primary bottle renderer everywhere bottles are visible.

The procedural `coke-bottle.tsx` we've polished stays in the tree (its API is the prop contract that this phase honors), but the three high-visibility consumers switch to GLB.

## Asset

- Path: `/assets/models/coca-cola-bottle.glb` (served by Vite from `public/assets/models/coca-cola-bottle.glb`)
- Size: 4.6 MB
- Already copied into the project.
- Preload at module level: `useGLTF.preload('/assets/models/coca-cola-bottle.glb')` so the asset starts loading before any component mounts.

## Tasks

### 1. New component: `src/scene/brand/bottle-gltf.tsx`

Loads the GLB via `useGLTF`, normalizes scale + origin so external callers can use `scale={X}` the same way they would with the procedural bottle, and wires the same `CokeBottleProps` interface for drop-in replacement.

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CokeBottleProps } from './coke-bottle';

const BOTTLE_URL = '/assets/models/coca-cola-bottle.glb';

// Preload at module load — the asset starts fetching the instant the file is imported.
useGLTF.preload(BOTTLE_URL);

/**
 * Target normalized height for the bottle, matching the procedural bottle's
 * y=1.55 total height. Consumer code uses scale={X} relative to this baseline.
 */
const TARGET_HEIGHT = 1.55;

export function BottleGltf({
  scale = 1,
  lift = 0,
  highlight = 0,
  // showLogo, customLabel, interior, reducedMotion — accepted silently (GLB materials are fixed)
  onPointerOver,
  onPointerOut,
  onClick,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(BOTTLE_URL);

  // Clone once so multiple instances don't share mutable scene state
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute the GLB's bounding box at load and derive a normalization factor
  // so the GLB's total height matches our procedural bottle's y=1.55 unit baseline.
  const { normalizedScale, originOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const factor = TARGET_HEIGHT / size.y;
    // Offset so the bottom of the bottle sits at local y=0 (matches procedural)
    const offsetY = -box.min.y * factor;
    return {
      normalizedScale: factor,
      originOffset: new THREE.Vector3(-center.x * factor, offsetY, -center.z * factor),
    };
  }, [cloned]);

  // Collect candidate "label" or "glass" materials for emissive-lerp on highlight.
  // Heuristic: any MeshStandardMaterial/MeshPhysicalMaterial that has a name
  // containing 'label', 'glass', or 'cap' (case-insensitive) is brightened on highlight.
  const highlightMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  useEffect(() => {
    const collected: THREE.MeshStandardMaterial[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) collected.push(m as THREE.MeshStandardMaterial);
          });
        } else if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          collected.push(mat as THREE.MeshStandardMaterial);
        }
      }
    });
    highlightMaterialsRef.current = collected;
  }, [cloned]);

  const hRef = useRef(highlight);
  hRef.current = highlight;

  useFrame((_, dt) => {
    // Gentle emissive lerp on highlight materials when highlight prop changes
    const mats = highlightMaterialsRef.current;
    if (!mats.length) return;
    const target = 0.0 + hRef.current * 0.35;
    for (const m of mats) {
      m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8);
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, lift, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <group scale={normalizedScale} position={originOffset.toArray() as [number, number, number]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
```

### 2. Replace in consumers

In each consumer file, swap the `<CokeBottle ... />` JSX for `<BottleGltf ... />`. The procedural import can stay for the type re-export, or you can switch to importing `CokeBottleProps` from the procedural file and adding a new export pattern.

#### `src/scene/acts/act-bottle.tsx` (takeaways hero)

Replace:
```diff
- import { CokeBottle } from '../brand/coke-bottle';
+ import { BottleGltf } from '../brand/bottle-gltf';
...
-        <CokeBottle scale={1} highlight={0.6} showLogo />
+        <BottleGltf scale={1} highlight={0.6} />
```

The PresentationControls wrapper stays. The current y=-1.8 offset stays.

#### `src/scene/brand/vending-machine.tsx` (machine slot bottles)

The machine renders 4 BottleSlot children. Inside each BottleSlot, swap `<CokeBottle scale={0.58} ... />` for `<BottleGltf scale={0.58} ... />`. Preserve `highlight` prop passing.

#### `src/scene/acts/act-tools.tsx` (wooden crate bottles)

The crate renders 6 bottles via `BottleInCrate`. Each calls `<CokeBottle scale={0.7} showLogo highlight={0.1} />`. Swap to `<BottleGltf scale={0.7} highlight={0.1} />` (showLogo is no-op for GLB but accepted silently).

The neck-tag plane stays — it's a separate decoration the implementer (not the GLB) provides.

### 3. Suspense fallback

Each consumer that mounts `<BottleGltf />` needs to be wrapped in `<Suspense fallback={null}>` IF not already inside a Suspense boundary. Verify by reading `scene-root.tsx` — there's already a top-level `<Suspense fallback={null}>` around the scene children, so individual bottles don't need their own.

Don't add per-bottle Suspense unless you find one is needed during build.

### 4. Verify the procedural `coke-bottle.tsx` still builds

Don't delete or modify `coke-bottle.tsx`. It exports `CokeBottleProps` which `bottle-gltf.tsx` imports. Verify the import path stays intact after refactor.

## Acceptance criteria

- `BottleGltf` component renders the GLB asset with correct normalized height (~1.55 units)
- Origin centered so external `scale={X}` works the same as with the procedural bottle
- Takeaways view shows the GLB bottle (centered, ~viewport height)
- Vending machine 4 slots show GLB bottles (smaller, scale 0.58)
- Wooden crate shows 6 GLB bottles (scale 0.7, with neck-tags still working)
- `useGLTF.preload` called at module scope so asset starts loading immediately
- `npm run build` passes
- No console warnings about missing materials or transformations

## Out of scope

- Don't modify the procedural `coke-bottle.tsx` or `coke-bottle-geometry.ts`. They stay as dev fallback.
- Don't bake new textures into the GLB.
- Don't add a custom shader on the GLB this round (deferred).
- Don't touch any non-bottle consumer file.

## Performance notes

- Use `scene.clone(true)` once via `useMemo` so multiple bottle instances don't share scene state. Cloning happens at mount per bottle — fine for our ~11 total instances (1 takeaways + 4 machine + 6 crate).
- The GLB is 4.6MB — that's a single HTTP request, the GLTFLoader caches it via `useGLTF`, so all 11 instances share the same source asset.
- DRACO compression: if the GLB uses Draco, drei's `useGLTF` requires `DRACOLoader` setup. Test build output to confirm — if you see a "DRACOLoader required" error, configure: `useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')`.

## Verification

```bash
npm run dev
# Open localhost:5173
# Press Start → machine-hub: 4 GLB bottles visible in machine slots
# Press 2 → Tools: 6 GLB bottles in crate (with neck-tags)
# Press 4 → Takeaways: hero GLB bottle, centered
# Console clean
```
