# Phase A Report — Bottle GLB pipeline

**Date:** 2026-06-06  
**Branch:** polish-pass-4  
**Status:** DONE

---

## Files Changed

| File | Change | Lines |
|---|---|---|
| `src/scene/brand/bottle-gltf.tsx` | NEW — GLB loader component | 119 |
| `src/scene/acts/act-bottle.tsx` | Import + JSX swap (2 lines) | — |
| `src/scene/brand/vending-machine.tsx` | Import added + BottleSlot JSX swap | — |
| `src/scene/acts/act-tools.tsx` | Import swap + BottleInCrate JSX swap | — |

Files not touched: `coke-bottle.tsx`, `coke-bottle-geometry.ts`, `scene-root.tsx`.

---

## Tasks Completed

- [x] `src/scene/brand/bottle-gltf.tsx` created with full `CokeBottleProps` interface
- [x] `useGLTF.preload` called at module scope
- [x] `scene.clone(true)` via `useMemo` per instance — no shared state
- [x] Bounding-box normalization: `TARGET_HEIGHT = 1.55`, base at `y=0`
- [x] Highlight emissive lerp across all `MeshStandard`/`MeshPhysical` materials, collected once in `useEffect`
- [x] `showLogo`, `customLabel`, `interior`, `reducedMotion` accepted silently as named params (prefixed with `_`)
- [x] `onPointerOver`, `onPointerOut`, `onClick` wired to outer group
- [x] `act-bottle.tsx` — `<CokeBottle>` → `<BottleGltf>` (hero takeaways view)
- [x] `vending-machine.tsx` — `<CokeBottle>` → `<BottleGltf>` in `BottleSlot` only; `SelectButton` mini bottle kept as `CokeBottle` (button UI, not a bottle slot — per spec "only swap the CokeBottle JSX inside BottleSlot")
- [x] `act-tools.tsx` — `<CokeBottle>` → `<BottleGltf>` in `BottleInCrate`; neck-tag plane preserved unchanged
- [x] No per-bottle `<Suspense>` added — top-level boundary in `scene-root.tsx` covers all instances

---

## Build Result

```
tsc --noEmit   → PASS (zero errors)
vite build     → PASS ✓ built in 2.67s
```

Chunk size warning (`index-FXzHuVEo.js 1521 kB`) is pre-existing — Three.js + R3F bundle, unrelated to this phase.  
No DRACOLoader error — the GLB does not use Draco compression.

---

## GLB Bounding Box

Not measured offline (would require a Node/headless Three.js script). The normalization runs live in the browser:

```ts
const box = new THREE.Box3().setFromObject(cloned);
const size = box.getSize(new THREE.Vector3()); // size.y drives the factor
const factor = 1.55 / size.y;
const offsetY = -box.min.y * factor;           // base sits at y=0
```

To inspect at runtime: open the browser console and add a `console.log(size, box.min.y)` after the `setFromObject` call in `bottle-gltf.tsx` line 58. The computed `normalizedScale` will equal `1.55 / size.y`.

---

## Console Warnings

None expected. DRACOLoader not triggered. The `(!) Some chunks are larger than 500 kB` is a Vite advisory (pre-existing), not a runtime warning.

---

## Notes

- `SelectButton` mini bottle in `vending-machine.tsx` was intentionally left as `CokeBottle` (scale 0.12, top-down cap view for the button UI). The spec scopes the swap to `BottleSlot` only. If the orchestrator wants SelectButton also switched, it is a one-line change.
- The neck-tag plane in `BottleInCrate` (`act-tools.tsx` lines ~507-511) is untouched — it hangs at crate-local `y=0.80 z=0.14` as specified.
- `coke-bottle.tsx` and `coke-bottle-geometry.ts` are not modified; they remain as the prop-contract definition and dev fallback.
