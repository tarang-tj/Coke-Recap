# Z-fighting fix: Coca-Cola logo decals (polygon offset)

Date: 2026-06-10 | Branch: polish-pass-10 | File: src/scene/coca-cola-diorama.tsx

## Problem
The flat logo-decal planes (vending header, button medallion, fascia, car ad, barrel label, window poster) sit coplanar with the panels behind them → depth-buffer z-fighting shimmer, amplified by camera idle drift. User saw the vending-machine logo "glitching".

## Fix
In `applyAlphaCutout()` (the one place every cutout decal material passes through):

```ts
m.polygonOffset = true;
m.polygonOffsetFactor = -1;
m.polygonOffsetUnits = -1;
```

Negative offset pulls the decal toward the camera in depth so it wins the depth test cleanly. CarBody recolor path intentionally untouched (solid mesh, not a decal). `Coke_ghost_m` remains omitted from the cutout list (never on camera) — unchanged behavior.

## Verification
- `npm run typecheck` — clean.
- `/tmp/zfight-tools.png` (#tools, machine close view): header logo crisp red script on cream, no torn/missing patches. No console errors, no failed requests.
- `/tmp/zfight-home.png` (home): button medallion (white-on-red disc) and storefront fascia (white-on-red awning) both crisp. No console errors, no failed requests.
- Crops: /tmp/zf-header-crop.png, /tmp/zf-home-crop.png.

## Unresolved Qs
- None. (Static shots can't show shimmer-over-time directly, but polygon offset removes the depth tie that caused it; the offset applies to all 6 cutout decals uniformly.)
