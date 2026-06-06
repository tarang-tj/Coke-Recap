# Role Motif Rebuild — Lens + Globe

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3

## Status: DONE

## Files Changed

- `src/scene/acts/act-role.tsx` — complete rewrite (~220 lines, same export `ActRole`)

## Build Result

`npx vite build` — **PASS** (2.35 s, 645 modules, zero errors/warnings attributable to this change; pre-existing chunk-size advisory unchanged)

## What Shipped

Chrome magnifying lens (torus bezel + cylinder handle + red-tinted clearcoat glass disc) slow-orbits a wireframe icosahedron globe with dark fill. Lens always faces globe center via `lookAt(0,0,0)`. Hover accelerates orbit (0.22 → 0.55 rad/s) and brightens glass emissive (0.4 → 0.85). Globe rotates on Y at 0.18 rad/s. Six cream landmass patches hint at continents. Entrance dive + scale-in from envelope preserved exactly. No "Coca-Cola" text, no `<Text>` import, no `transmission` material anywhere.

## Implementation Notes

- `lensSpotRef` (PointLight, color `#F40009`, distance 2.5) position is updated to `lensGroup.position` each frame — gives moving red "examining" glow under the lens.
- Glass cylinder oriented flat (disc face toward globe) because `lookAt` rotates the whole lens group so its +Z faces (0,0,0); the disc's flat face therefore always looks at the globe surface — reads as glass examining the wireframe.
- `frustumCulled={false}` on all meshes to match existing pattern (envelope moves group to z=1.5 on enter, outside local bounding sphere).
- Reduced-motion: globe rotation stops, lens parks at `angle = 0.8 rad` (upper-right, pleasing composition).

## Concerns

None blocking. One pre-existing advisory: JS bundle >500 kB (whole R3F/Three.js tree); unrelated to this change.
