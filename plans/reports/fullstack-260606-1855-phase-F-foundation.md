# Phase F Foundation — Implementation Report

**Date:** 2026-06-06
**Phase:** F — Scene atmosphere foundation
**Plan:** /Users/tarangjammalamadaka/dev/Coke-Recap/plans/260606-1855-art-direction-uplevel/
**Branch:** redesign/polish-pass-3

---

## Status: DONE

---

## Files Modified

| File | Lines | Change type |
|------|-------|-------------|
| `src/scene/scene-root.tsx` | 62 | Added Environment + ContactShadows imports and mount |
| `src/scene/scene-lighting.tsx` | 40 | Full rewrite — 3-light hero setup |
| `src/scene/scene-backdrop.tsx` | 222 | Full rewrite — vertical gradient + vignette + 80-particle dust field |
| `src/scene/postprocessing-stack.tsx` | 52 | Tuned bloom/vignette + added Noise film grain |

No files outside owned set were touched.

---

## Tasks Completed

- [x] HDR environment — `<Environment preset="warehouse" background={false} />` in scene-root inside Suspense
- [x] ContactShadows — `y=-1.6, opacity=0.55, blur=2.6, far=4, resolution=512` in scene-root
- [x] Atmospheric backdrop rewrite — vertical gradient (burgundy top → brand red horizon → dark wine bottom) composited with radial corner vignette via canvas multiply blend
- [x] Dust particle field — 80 InstancedMesh cream billboards, deterministic seeded positions, slow downward + slight horizontal drift, opacity 0.15–0.30, additive blending, bound-wrap recycling
- [x] Particle freeze under `useReducedMotion` — `if (!mesh || reduced) return` in useFrame
- [x] Lighting overhaul — replaced multi-color point-light salad with:
  - Hero key: `directionalLight` pos=[-5,8,4] intensity=1.4 color=#FFF6E0 castShadow
  - Soft fill: `hemisphereLight` sky=#FF8A8A ground=#3A0006 intensity=0.35
  - Brand rim: `pointLight` pos=[4,-2,-3] intensity=1.8 color=#F40009 distance=9
  - Ambient lift: `ambientLight` intensity=0.12 color=#FFEFE0
- [x] Postprocessing tuned:
  - Bloom: intensity=0.6, luminanceThreshold=0.85, luminanceSmoothing=0.025
  - Vignette: darkness=0.85, offset=0.3 (noticeably stronger)
  - Noise: opacity=0.08, premultiply=false, BlendFunction.OVERLAY (film grain)
  - MSAA multisampling=4 retained
- [x] No transmission materials anywhere
- [x] No act files touched

---

## Build Result

```
✓ tsc --noEmit   — 0 errors
✓ vite build     — 645 modules, built in 2.49s, 0 errors
```

Pre-existing bundle-size advisory present (index JS chunk >500 kB) — not introduced by this phase, not an error.

---

## Dev Server

Not launched (headless environment). All visual assertions made via code inspection:

- `background={false}` on Environment confirmed — SceneBackdrop skydome wins
- Gradient texture uses `ctx.globalCompositeOperation = 'multiply'` for radial vignette compositing
- Particle field uses `THREE.AdditiveBlending` + `depthWrite=false` for correct layering over backdrop
- `castShadow` on directional light will cooperate with any `receiveShadow` surfaces in act files

---

## Self-Review Checklist

- [x] `npm run build` passes
- [x] Particle field freezes under `useReducedMotion` — confirmed line 161: `if (!mesh || reduced) return`
- [x] Multi-color point-light salad replaced — scene-lighting has exactly 4 lights (key/fill/rim/ambient), no leftover cyan rim, no soft-warm fill point from [0,0,0]
- [x] Postprocessing has `<Noise>` with `BlendFunction.OVERLAY`
- [x] HDR Environment uses `background={false}`
- [x] ContactShadows at y=-1.6 / opacity=0.55 / blur=2.6

---

## Concerns

None blocking. One observation:

- The `<ContactShadows>` plane is a single global at y=-1.6. If act centerpieces in phases R/T/A float significantly above this plane, act owners may want to add a local ContactShadows inside their group. The spec anticipates this and explicitly allows it ("If a specific act's centerpiece floats too far above the shadow, the act can include its own additional ContactShadows").

---

## Docs Impact

None — no architectural additions, no new dependencies beyond already-imported drei/postprocessing exports.
