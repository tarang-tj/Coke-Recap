# Phase L — Tools-act neck-tag readability

**Status:** DONE_WITH_CONCERNS
**Date:** 2026-06-06

## Files changed

- `src/scene/acts/act-tools.tsx` — only file touched

## Tasks completed

- [x] Canvas resolution bumped 128×80 → 512×384
- [x] `texture.anisotropy = 8` set on every returned CanvasTexture
- [x] Background `#EAD8B0` (aged cream, more saturated than old `#F0E8D0`)
- [x] Dark ink border `#1A1408`, lineWidth 6px (double rect: outer 6px + inner 2px for printing feel)
- [x] Tool name in `bold 80px "Courier New", monospace` (auto-scales to 48px min for long names like "Internal Tooling")
- [x] Ink color `#1A1408`, double-pass stamp effect for worn look, ink-depth shadow
- [x] Red "TOOL" microtype stamp at top: `bold 28px Georgia, serif`, color `#A60010`, letter-spacing via spaces (`T  O  O  L`)
- [x] Thin red rule under the stamp
- [x] Punched hole re-scaled to 18px radius to match new canvas dimensions
- [x] Tag plane changed from `<planeGeometry args={[0.18, 0.11]}>` to `<boxGeometry args={[0.32, 0.20, 0.005]}>`
- [x] Tag repositioned: `position={[0.0, 0.80, 0.14]}` — centered x, y≈0.80 (bottle-local ≈1.14), z=+0.14 forward to clear glass
- [x] All 6 tool names sourced from `data/portfolio-content.ts → tools` array (unchanged)

## Build result

`npm run build` → tsc clean + vite build clean in 2.48s. Only pre-existing chunk-size warning (no new errors).

## Summary

Neck-tag CanvasTextures are now 4× resolution (512×384), bold 80px typewriter font at high contrast, with a red "TOOL" stamp, dark ink border, and the tag plane is ~2× area (`0.32 × 0.20`). Tag is centered on the bottle neck and pushed forward +0.14 in z to avoid glass clipping.

## Concerns

1. **y position may need touch-up after Phase B merges.** The tag is placed at crate-local y=0.80 (≈ bottle-local 1.14 at scale 0.7). Phase B replaces the screw cap with a thinner crown cap, which may shift the effective neck-top position slightly. After Phase B merges, visually verify the tag hangs cleanly just below the crown cap; a delta of ±0.03–0.05 in the `position[1]` value is likely sufficient to correct.

2. **`ctx.letterSpacing` browser compat.** `CanvasRenderingContext2D.letterSpacing` is a newer property (baseline ~2023). It's set before the "TOOL" text and reset to `'0px'` after. As a fallback, the text is written as `'T  O  O  L'` (double-spaces) so even in envs that ignore the property it retains the spaced-out stamp feel. Vite/modern browser target is fine; no issue expected.

3. **Twine ring not repositioned.** The twine torus stays at y=0.917 (matching old screw-cap anchor). After Phase B, this may also need a small y adjustment to match the new crown cap position.
