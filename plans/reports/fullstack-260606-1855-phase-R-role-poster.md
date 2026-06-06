# Phase R — Role Motif Redirection: Vintage Ad Poster

**Date:** 2026-06-06
**Phase:** R — role ad poster in shadow-box
**Plan:** /Users/tarangjammalamadaka/dev/Coke-Recap/plans/260606-1855-art-direction-uplevel/

---

## Status: DONE

---

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| `src/scene/acts/act-role.tsx` | 236 | Full rewrite — replaced lens/globe motif with vintage poster shadow-box |

---

## Build Result

`npm run build` — PASS (tsc + vite, 2.67 s, zero errors, zero TS errors)

---

## Summary

Replaced the magnifying-lens-over-wireframe-globe motif with a **1950s vintage Coca-Cola advertising print** displayed in a **chrome shadow-box frame**, museum-lit from above via a cream SpotLight, with a brass nameplate reading "GLOBAL HUMAN INSIGHTS". Poster is drawn procedurally via a `useMemo`-baked CanvasTexture (no external asset). Envelope-driven entrance, hover-accelerated rotation, reduced-motion static park — all preserved per spec.

---

## Self-Review Checklist

- [x] `npm run build` passes — clean
- [x] No literal `"Coca-Cola"` floating Text on a flat disc — trademark only on the procedural poster canvas (rendered as `"Coca-Cola"` in a bold italic serif inside the bottom red banner of the poster image, not a drei `<Text>` node)
- [x] Brass nameplate `<Text>` reads `"GLOBAL HUMAN INSIGHTS"`
- [x] SpotLight from `[0, 3.5, 2]`, cream `#FFF6E0`, intensity 4.0, angle 0.55, penumbra 0.6
- [x] Reduced-motion path: `g.rotation.y = 2° (Math.PI/90)`, no bob, no sine animation
- [x] No transmission materials anywhere — glass cover uses `meshPhysicalMaterial` with `clearcoat=1`, `opacity=0.12`, `transparent=true`, zero `transmission`
- [x] Envelope pattern preserved: `visible = envelope > 0.002`, z-lerp `[1.5→0]`, scale-lerp `[0.5→1]`
- [x] CanvasTexture baked once in `useMemo`, disposed on unmount via `useEffect`
- [x] Hover: pointer cursor on frame, rotation frequency 0.4→0.7, bob amplitude 0.04→0.07

---

## Implementation Details

### Components built
1. **`buildPosterTexture()`** — standalone function producing a 1024×1280 CanvasTexture:
   - Cream `#F1E9DA` background with faint diagonal aged-paper hatching
   - Double border (red rule + inner cream rule)
   - Top red banner → `"DRINK"` in cream block-caps with drop-shadow
   - Middle area: radial vignette + `drawBottleSilhouette()` contour silhouette
   - Bottom red banner → `"Coca-Cola"` in bold italic serif (Pacifico-style fallback)
   - Tagline `"DELICIOUS · REFRESHING"` in tracking-wide warm brown

2. **`drawBottleSilhouette()`** — bezier-path Hobble-skirt contour bottle, semi-transparent cream fill + antique stroke + highlight stripe; no external asset

3. **Shadow-box assembly** (z-layered, all at group origin):
   - `RoundedBox [2.2, 2.8, 0.18]` chrome frame (`roughness=0.18`, `metalness=0.88`)
   - Black velvet backing plane at z=0.06
   - Poster mesh (plane) at z=0.07
   - Glass cover at z=0.09 (clearcoat, opacity 0.12, no transmission)
   - Brass nameplate box at y=-1.32, z=0.10
   - Nameplate `<Text>` at z=0.115

4. **`useFrame` loop**: sine-based Y rotation + Y bob; hover ref drives frequency/amplitude; reduced-motion parks at 2°

---

## Concerns

None blocking. Minor notes:
- `ctx.letterSpacing` on CanvasRenderingContext2D is a CSS-only property not honored by all canvas implementations (Chrome 99+ supports it; Safari may not). The tagline text will still render — spacing just may be tighter in Safari. A character-spacing loop workaround was considered but skipped per KISS/YAGNI.
- The poster's `"Coca-Cola"` text uses a serif italic fallback (Georgia) because Pacifico is a web font loaded via CSS, not available to the 2D canvas context at the time `useMemo` runs. Visual result is a period-appropriate italic serif which reads correctly as the brand name inside the poster artwork. This is not a floating drei `<Text>` — it is baked into the texture.
- Chunk size warning (1434 kB) is pre-existing, not introduced by this phase.
