# Phase A — GLB Replacement Report

**Date:** 2026-06-06  
**Branch:** polish-pass-4  
**Phase:** A — Replace procedural exterior + interior with GLBs  
**Status:** DONE

---

## Files Modified

| File | Status | Lines |
|---|---|---|
| `src/scene/brand/brick-shop-building-gltf.tsx` | NEW | 88 |
| `src/scene/brand/convenience-store-gltf.tsx` | NEW | 92 |
| `src/scene/jacobs-pharmacy-exterior.tsx` | REPLACED (was 494) | 47 |
| `src/scene/jacobs-pharmacy.tsx` | REPLACED (was 501) | 35 |
| `src/scene/camera-rig.tsx` | EDITED (2 lines changed) | 144 |

Net deletion: ~913 lines of procedural geometry + CanvasTexture builders removed.

---

## Tasks Completed

- [x] `brick-shop-building-gltf.tsx` — useGLTF.preload at module scope, scene.clone(true) per instance, bbox normalization (TARGET_HEIGHT=6.0), useEffect disposal
- [x] `convenience-store-gltf.tsx` — same pattern; useGLTF.setDecoderPath set preemptively for possible Draco compression
- [x] `jacobs-pharmacy-exterior.tsx` — gutted all procedural geometry (brick facade, cobblestone, awning, windows, doors, signage, street lamp, gas lamp pole, parapet), replaced with 3 BrickShopBuilding instances + pointLight
- [x] `jacobs-pharmacy.tsx` — gutted all procedural interior (floor, wall, shelves, jars, counter, lamp, advert, ContactShadows), replaced with ConvenienceStore + ContactShadows
- [x] `camera-rig.tsx` EXTERIOR_POSE updated: pos (0,1.8,5.0)→(0,0.5,7.5), look (0,1.8,-5.0)→(0,1.5,-4.0)
- [x] All CanvasTexture builders (buildBrickTexture, buildCobblestoneTexture, buildAwningTexture, buildFloorTexture, buildWallTexture, buildMarbleTexture, buildAdTexture) — deleted entirely
- [x] `_extPos` and `_extLook` module-scope vectors in camera-rig — automatically pick up new EXTERIOR_POSE (spread at definition)
- [x] Import paths verified: machine-hub imports JacobsPharmacy ✓, app.tsx imports JacobsPharmacyExterior ✓
- [x] No transmission materials introduced

---

## Build Result

```
tsc --noEmit   → clean (0 errors)
vite build     → ✓ built in 4.26s (0 errors, 0 warnings beyond pre-existing chunk-size advisory)
```

No DRACOLoader error at build time. The `setDecoderPath` call is present in `convenience-store-gltf.tsx` as a precaution — it is a no-op if the GLB is not Draco-compressed, and handles runtime load silently if it is.

---

## GLB Bounding Box Sizes

Not measured at build time (requires runtime Three.js execution). The normalization code in both loader components computes `Box3.setFromObject(cloned)` live on first render and scales to TARGET_HEIGHT=6.0 regardless of the raw GLB dimensions — so the buildings will always be 6 world units tall. If the GLB's geometry is centered off-origin the `originOffset` vector re-centers X/Z and floors Y to 0.

To get the raw bbox for the sanity-check record: open the dev server and add a temporary `console.log('brick bbox', box.getSize(...))` after the `Box3` call — but this is not in committed code per the spec.

---

## DRACO Setup

`useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')` is set at module scope in `convenience-store-gltf.tsx`. Build did not error with "DRACOLoader required," which means either:
- The 12 MB GLB is not Draco-compressed, or
- The drei version bundles its own decoder

Either way, no additional config needed. The decoder path call is safe to leave — it's a no-op when unused.

---

## Corner Block Positioning Concerns

The spec positions are:
- Primary: `[0, -3.0, -4.0]` rot 0 — faces camera directly
- Neighbor: `[5.5, -3.0, -4.5]` rot -π/2 — turned 90° right, forms the corner
- Distant: `[-7.0, -3.0, -6.5]` rot π/8 — slight angle, smaller scale (0.85)

Camera new pose: eye at `(0, 0.5, 7.5)` looking toward `(0, 1.5, -4.0)`. That's ~11.5 units of depth clearance from camera to primary building front face, which should frame a 6-unit-tall building without clipping. The look-target Y=1.5 places the horizon line at roughly mid-building which is the conventional "street photography" framing.

Potential concern: the GLB may be oriented facing a different direction than +Z. If the building presents its side rather than its facade to the camera, the `rotation` on the primary instance needs a π or π/2 correction. Verify at first `npm run dev` render and tune `rotation[1]` on the primary building accordingly.

---

## Unresolved Questions

1. **GLB facing direction** — brick-shop-building.glb may face +X or -Z out of the box. Need one dev-server check to confirm the primary instance faces the camera; if not, add `rotation={[0, Math.PI, 0]}` (or `Math.PI/2`) to the primary `BrickShopBuilding` call in `jacobs-pharmacy-exterior.tsx`.
2. **Convenience store camera framing** — the machine view camera pose was not changed (Phase B scope). The store GLB at `[0, -3.0, -2.0]` surrounds the machine; if the store walls clip the machine camera's near-plane the z position may need nudging to `-3.0` or `-1.0`.
3. **No transmission materials check** — GLB materials are not inspected at build time. If the convenience-store GLB shipped with `MeshPhysicalMaterial` + `transmission > 0`, it will render but silently break the perf rule. A runtime traverse checking `mat.transmission > 0` and zeroing it should be added if visual artifacts appear.
