# Martech Pipeline exhibit — THE STACK (tools view)

## What
New diegetic 3-D exhibit `MartechPipeline` in `src/scene/martech-pipeline.tsx` (207 lines, new file, only file owned/created). app.tsx NOT modified (temporarily mounted for screenshots, then my lines removed; sibling agents' GrowthRibbon/ConsumerFunnel lines preserved).

## Design
- Low dark-wood apothecary bench (1.3 m wide plinth, top at y 0.51) with brass front trim + brass caption plate — mirrors metrics-display.tsx palette/conventions (WOOD #3A2618, BRASS #B08D57, same pillStyle).
- 3 brass-and-glass stations (brass base + stem, transparent glass flask, brass finial) at local x −0.42 / 0 / +0.42; centre station taller.
- Copper TubeGeometry (96 segs, r 0.012) along a closed CatmullRomCurve3 through the vessels; return run ducks behind the bench.
- 12 emissive amber-red droplets (#FF5A1F, emissiveIntensity 2.6, r 0.024) — ONE instancedMesh, shared Object3D dummy, `curve.getPointAt(u, dummy.position)` → zero per-frame allocations. Speed 0.06 loops/s, phase offset i/12.
- Reduced motion / non-tools views: matrices written once (distributed rest positions), then useFrame early-returns.
- Html pills (distanceFactor 5.5) DATA IN/Sources, INSIGHT/Modeling (high row), ACTIVATION/Campaigns + "MARTECH PIPELINE — ILLUSTRATIVE" plate pill — all gated to `view === 'tools'`. Bench always mounted.
- `raycast={() => null}` on the group AND every mesh/instancedMesh (group-level alone doesn't stop child meshes).

## Final placement
- POS `[5.23, 0, -9.06]`, ROT_Y `2.67` (front faces tools camera).
- 3.56 m horizontal clearance from hotspot proxy [3.6, 0.77, −5.9] (req ≥1.5 m). Camera ray to machine passes above bench meshes.
- Beacon at y 2.32 above machine — pills sit far below it; no occlusion of machine, beacon, soda-fountain stand, or DOM captions (verified in /#tools screenshot crops; iterated once: v1 had DATA IN pill colliding with left caption + pill crowding → shifted screen-right 0.55 m, toward camera 0.25 m, staggered pill rows).

## Verification
- `npm run typecheck` clean (before and after app.tsx revert).
- /#tools screenshot: bench legible, droplets visible as amber beads on tube, pills legible, no occlusion. Home screenshot: bench unobtrusive, no pills leak. Zero console errors / failed requests in all shots.

## Unresolved
- None. (Glass flasks read brass-tinted at this distance — period-appropriate, left as is.)
