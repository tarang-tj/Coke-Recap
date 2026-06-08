# Phase B Report — View-aware Backdrop + Remove Bottle Hover-lift

**Date:** 2026-06-06  
**Branch:** polish-pass-4  
**Status:** DONE

---

## Files Modified

| File | Change |
|---|---|
| `src/scene/scene-backdrop.tsx` | Full rewrite: CanvasTexture gradient → ShaderMaterial with 3 uniforms; view-aware palette lerp; dust motes gated on chapter views |
| `src/scene/brand/vending-machine.tsx` | Deleted `LIFT_HOVER = 0.14` constant; removed hover-Y-lift from `BottleSlot` frame loop |

---

## Tasks Completed

- [x] Skydome rebuilt as `THREE.ShaderMaterial` (vertexShader + fragmentShader) with `uColorTop / uColorMid / uColorBot` uniforms
- [x] Three palette groups defined: `exterior` (dark dusk), `machine` (dim walnut), `chapter` (original red atmospheric)
- [x] `useNavigation().view` read in `SceneBackdrop`; target color refs updated on view change via `useEffect`
- [x] 200ms smooth color lerp implemented in `useFrame` via `THREE.Color.lerp` at `COLOR_LERP_SPEED = 5` (exponential smoothing, no hard cut)
- [x] Dust mote `InstancedMesh` gated with `visible={isChapterView}` prop — hidden on `exterior` and `machine`, shown on all four chapter views
- [x] Reduced motion freeze preserved — `if (!mesh || reduced) return` in `DustParticles.useFrame` unchanged
- [x] `LIFT_HOVER` constant deleted from `vending-machine.tsx`
- [x] `BottleSlot` frame loop updated: `targetLift = pressRef.current ? -0.35 : 0` (hover no longer translates Y)
- [x] Scale bump (1.06) on hover preserved — provides residual hover feedback without Y lift
- [x] Press scrunch (-0.35) preserved — dispense animation intact
- [x] No `LIFT_HOVER` references remain (grep confirms 0 matches)
- [x] No transmission materials introduced

---

## Build Result

```
tsc -b && vite build
✓ 650 modules transformed.
✓ built in 2.94s
```

`tsc` clean. Vite build clean. Chunk-size advisory is pre-existing, unrelated to this change.

---

## Self-review Checklist

- [x] Backdrop palette swaps cleanly on view change — no flicker (lerp via ShaderMaterial uniform mutation)
- [x] Dust motes invisible on `exterior` + `machine`; visible on `role/tools/agent/takeaways`
- [x] 200ms lerp via `Color.lerp` in `useFrame` — not React state
- [x] Bottle hover: no Y translation; scale bumps to 1.06 only
- [x] `LIFT_HOVER` deleted, zero references remain
- [x] `npm run build` passes
- [x] tsc clean
- [x] No transmission materials

---

## Implementation Notes

- The old `makeGradientTexture()` (CanvasTexture approach) was fully removed per spec — replaced by a GLSL shader that blends `uColorBot → uColorMid → uColorTop` over two segments (0..0.45 and 0.45..1 of normalised local Y).
- `renderOrder={-1}` and `frustumCulled={false}` preserved on the skydome mesh for correct draw order.
- `fog={false}` was dropped since `ShaderMaterial` ignores scene fog by default — functionally equivalent.
- Shader disposes on component unmount via `useEffect` cleanup.

---

## No Unresolved Questions
