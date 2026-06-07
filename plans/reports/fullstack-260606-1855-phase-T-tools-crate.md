# Phase T — Tools Crate Implementation Report

**Date:** 2026-06-06
**Phase:** T — Tools motif redirection (wooden crate)
**Branch:** redesign/polish-pass-3

## Status: DONE

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/scene/acts/act-tools.tsx` | Full rewrite | 340 lines |

No other files touched.

## Build Result

`npm run build` — PASS (tsc -b clean, vite built in 2.23s, 645 modules transformed)
Only warning: chunk size advisory (pre-existing, not introduced by this phase).

## What Was Implemented

### Scene structure
- `ActTools` root group at `[0.6, 0, 0]` — leaves left-side copy column clear
- Inner `crateGroupRef` carries rotation and bob; entrance envelope applied to root group
- Envelope pattern preserved: `group.visible = envelope > 0.002`, `position.z` lerp, `scale.setScalar(0.6 + 0.4 * envelope)`

### Crate geometry
- `CrateWalls`: 5 box planes (base + 4 walls). Left long wall uses `stencilMat` (CanvasTexture "Drink Coca-Cola" with aged-paint distress). Iron strap reinforcements (4×) at top/bottom of front and back walls. Copper nail-head accents at top corners.
- `CrateDividers`: 5 vertical + 3 horizontal thin box dividers creating 6×4 = 24 slots. Slot W ≈ 0.287, slot D ≈ 0.280 — fits scale-0.7 bottle footprint (≈ 0.26 diameter).

### Bottles
- 6 `CokeBottle` instances via `BOTTLE_SLOTS` array. Arrangement: 4 front row (cols 0,1,3,5) + 2 mid row (cols 2,4). 18 slots visibly empty.
- `scale={0.7} showLogo={true}` — trademark wordmark on label band.
- Per-bottle Y rotation jitter ±15° via seeded RNG (deterministic across renders).
- `BottleInCrate` positions each bottle on crate base at correct slot XZ.

### Neck-tags
- One `CanvasTexture` per tool (128×80px) baked in `useMemo`. Aged cream paper background, ink-stamp tool name in monospace, punched hole at top, ruled border.
- `MeshStandardMaterial` DoubleSide plane `[0.18, 0.11]` at bottle neck, slightly angled for natural hang.
- Twine torus `args={[0.108, 0.004, 6, 16]}` in `#A88B5C` around neck at y=0.917 (= 0.7 × 1.31).

### Floor
- `WoodPlanks`: rotated plane `[5, 4]` at `y = -CRATE_H/2 - 0.02`. CanvasTexture with 6 plank stripes, grain lines, dark grout, edge vignette. `roughness=0.95`.

### Lighting
- `<spotLight position={[1.5, 5, 2]} angle={0.6} penumbra={0.7} intensity={3.5} color="#FFE4B5" distance={10}>` — single warm overhead source
- `<ambientLight intensity={0.25} color="#FFF0D0">` — soft fill

### Motion
- `crateGroup.rotation.y += dt * 0.018` (~1°/s)
- `crateGroup.position.y = -0.02 + 0.02 * Math.sin(elapsed * 0.55)` (gentle bob)
- Under `useReducedMotion`: both frozen

### Hover
- `onPointerOver/Out` on crate group. Spotlight intensity lerps 3.5→4.2 over ~5 frames. Cursor → pointer.

### Materials (NO transmission)
- All materials: `meshStandardMaterial` or `meshPhysicalMaterial` (via CokeBottle). Zero transmission passes.

## Self-Review Checklist

- [x] Build passes
- [x] 24 slots (6 wide × 4 deep) from top-3/4 camera angle
- [x] 6 bottles in front + mid rows, 18 slots empty
- [x] Each bottle wears neck-tag with correct tool name from data
- [x] Aged-wood plank floor under crate
- [x] Single warm overhead spotlight
- [x] Slow Y rotation + gentle bob; frozen under useReducedMotion
- [x] No transmission materials
- [x] Envelope entrance pattern preserved
- [x] Only `act-tools.tsx` modified

## Concerns

None blocking. One minor note: `stencilTex` uses `Math.random()` inside `buildCrateStencilTexture()` (called inside `useMemo`) which produces non-deterministic grain lines on each mount. This is intentional for aged-paint variation and has no functional impact.
