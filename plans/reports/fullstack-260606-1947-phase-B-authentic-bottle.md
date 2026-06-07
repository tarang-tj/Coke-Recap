# Phase B — Authentic Coca-Cola Bottle — Implementation Report

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Status:** DONE

## Files Modified

| File | Change |
|---|---|
| `src/scene/brand/coke-bottle-geometry.ts` | Full rewrite: ~70-point profile, belly peak at y=0.44, 96-segment default |
| `src/scene/brand/coke-bottle.tsx` | Full rewrite: green glass, bigger label, crown cap, larger wordmark |

## Tasks Completed

- [x] **Georgia-green glass** — `GLASS_COLOR = '#2F4D2A'`, `GLASS_EMISSIVE = '#1A2D14'`, rib color `#3D6035`
- [x] **Clearcoat glass** — `roughness=0.10`, `clearcoat=1`, `clearcoatRoughness=0.06`, `opacity=0.85`; no `transmission` anywhere
- [x] **Interior liquid** — `LIQUID_COLOR = '#5A0006'` (unchanged); shows through green glass at opacity 0.85
- [x] **Silhouette refinement** — ~70 profile points; belly peak at y≈0.44 r≈0.355; waist pinch 0.205@y=0.630; shoulder bulge 0.332@y=0.770; 6–8 intermediate S-curve samples waist→shoulder
- [x] **Lathe segments** — bumped 64 → 96 in `buildBottleGeometrySet(96)` default
- [x] **Label band** — `LABEL_H=0.42` (was 0.26), `LABEL_Y=0.42`, `LABEL_R=0.358`, emissive red `#A60010` at intensity 0.2
- [x] **Wordmark plane** — `planeGeometry args={[0.62, 0.18]}` (was 0.34×0.10); positioned at `WORDMARK_Y`, `WORDMARK_Z`
- [x] **customLabel Text** — `fontSize=0.13`, `maxWidth=0.52`, `outlineWidth=0.016`, `letterSpacing=0.02`
- [x] **Crown cap** — `CrownCrimps` component: thin red disc (r 0.158→0.165, h=0.035), 21 instancedMesh flutes, top wordmark stamp
- [x] **Screw cap removed** — old `cylinderGeometry args={[0.163, 0.163, 0.075, 24]}` and cap-top disc gone
- [x] **Neck ring** — repositioned to y=1.340 to match new collar swell in updated profile
- [x] **Base ring** — punt torus at y=0.028 (unchanged radius 0.255) + new embossed dimple ring at y=0.050, r=0.210
- [x] **Props interface unchanged** — all 9 props preserved exactly: `scale`, `lift`, `highlight`, `showLogo`, `customLabel`, `interior`, `reducedMotion`, `onPointerOver`, `onPointerOut`, `onClick`
- [x] **No consumer files touched** — `vending-machine.tsx`, `act-tools.tsx`, `act-bottle.tsx` untouched

## Build Result

- `npx tsc --noEmit` — **clean, 0 errors**
- `npm run build` — **✓ built in 2.27s**, 645 modules
- Chunk-size warning is pre-existing Three.js bundle, unrelated to this change

## Summary

Rebuilt `CokeBottle` to look like a historic Georgia-green Coca-Cola contour bottle: green glass with clearcoat, a 60%-taller red label band, a 1.8× larger readable wordmark, a crimped 21-flute crown cap via instancedMesh, and a smoother 70-point/96-segment silhouette.

## Concerns for Consumer Review

1. **Neck-tag positioning (Phase L)** — The neck collar now sits at y=1.34 (was y=1.31). Phase L's neck-tag planes on `act-tools.tsx` crate bottles may need a y-position nudge of ~+0.03 to stay off the collar ring. Phase L implementer should verify.
2. **Vending-machine slot height** — Label band now spans y≈0.21→0.63 (was y≈0.33→0.59). The slot label-frame geometry in `vending-machine.tsx` may read slightly lower on the bottle; cosmetic only, does not break layout.
3. **act-bottle takeaways** — The hero bottle is taller visually because the label is bigger. Camera framing should still work; verify in-browser if the label clips the machine slot edge.
4. **Crown cap Z-fight** — The wordmark stamp on the cap top (`depthWrite={false}`) is consistent with the label wordmark treatment; should not Z-fight. Verify under direct overhead light in the machine scene.

No correctness blockers identified. All geometry is self-contained; consumer files pass unchanged through the build.
