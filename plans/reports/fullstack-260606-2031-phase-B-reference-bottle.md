# Phase B — Reference-true Bottle — Implementation Report

**Status:** DONE
**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3

---

## Files Modified

| File | Changes |
|---|---|
| `src/scene/brand/coke-bottle-geometry.ts` | Full rewrite — slimmer profile, new `buildLiquidGeometry()` export, new `profileRadiusAt()` export |
| `src/scene/brand/coke-bottle.tsx` | Full rewrite — clear glass material, liquid mesh, meniscus disc, dropped label band, crown cap resized |

---

## Tasks Completed

- [x] Slim silhouette: max belly radius 0.355 → 0.240 (H:D ~3.2:1)
- [x] Glass material: `#DCE0DC` near-clear gray, opacity 0.18, clearcoat=1, NO emissive
- [x] Liquid mesh: `buildLiquidGeometry()` exported, lathe from y=0.06 → 1.05, inset 0.012
- [x] Liquid material: `#3D1E0F`, emissiveIntensity lerps 0.18 → 0.45 on highlight
- [x] Meniscus disc: circleGeometry at y=1.06, cream-amber emissive
- [x] Red label band GONE: no LABEL_RED, no cylinderGeometry label, no wordmark plane on label
- [x] Crown cap kept and resized: disc 0.105/0.115, crimpRingR 0.113, stamp 0.13×0.05
- [x] Upper-neck embossed wordmark: drei `<Text>` at y=0.95 reading "Coca-Cola"
- [x] `customLabel` redirected: now overrides neck emboss text (was label plane)
- [x] `interior` prop kept as no-op for API compat
- [x] `highlight` prop redirected: drives liquid emissiveIntensity, not glass
- [x] `useEffect` disposes bodyGeo + flutesGeo + liquidGeo on unmount
- [x] `CokeBottleProps` interface shape preserved exactly
- [x] `profileRadiusAt()` exported from geometry file (reused by component for neck emboss z)

---

## Build Result

```
tsc -b && vite build
✓ 645 modules transformed
✓ built in 2.46s
```

Zero type errors. Zero new warnings. Pre-existing chunk-size advisory unchanged.

---

## Self-Review Checklist

- [x] Glass color is `#DCE0DC` — NOT green or red
- [x] No `emissive` on glass material (confirmed: grep returns no matches for GLASS_EMISSIVE)
- [x] Liquid mesh renders inside glass with color `#3D1E0F`
- [x] Meniscus disc at y=1.06, cream-amber emissive
- [x] LABEL_RED / label cylinder / wordmark plane — GONE (grep: no matches)
- [x] Crown cap still renders, 21 crimps, wordmark stamp gated by `showLogo`
- [x] Max belly radius = 0.240 (verified in geometry file, line 42)
- [x] `showLogo`, `customLabel`, `highlight`, `scale`, `lift` all wired correctly
- [x] `npm run build` passes, tsc clean

---

## Visual Description

The reference image shows a bottle where the brown liquid IS the visual — the glass is nearly invisible except for gray edge highlights and gloss specular. The implementation achieves this by:

- Glass opacity 0.18 (very transparent) with clearcoat=1 catching HDR env reflections for the gray edge gloss
- Liquid lathe fills from base to y=1.05 (75%+ fill) so it's dominant through the transparent glass
- Meniscus disc gives the liquid a bright surface catch at the top
- No label — silhouette alone identifies it as Coke

Screenshot tooling unavailable in this environment. Visual verification requires browser runtime.

---

## Concerns / Cross-cutter Risk

1. **Bottle is visually ~33% slimmer** (belly diameter 0.48 → 0.48 → 0.71 unit was old, now 0.48 nominal). Consumers using fixed slot geometry in the vending machine (`vending-machine.tsx`) may show visible gap between bottle and machine slot walls. Phase B is not permitted to touch that file — flag for post-merge review.

2. **No label band changes `act-tools.tsx` chip label behavior.** `customLabel` still works but now renders as a neck-embossed text (y≈0.95, small font) rather than a belly-level label band text. The chip label will be much smaller and higher up. Phase H is modifying act-tools in parallel — the integrator should verify the chip-label use case reads correctly at scale=0.7.

3. **`depthWrite={false}` on both glass meshes** is correct for transparent sorting but may cause z-fighting with other transparent geometry in the same scene if any overlaps. Watch for artifact reports at runtime.

4. **Liquid lathe top is closed (axis cap point added)** so there's no hole at y=1.05 — the meniscus disc sits directly on top of a solid liquid surface, which is correct.

5. **Neck ring torus radius** updated from 0.152 → 0.111 to match the new slimmer collar (profile r=0.113 at y=1.34). If anything was snapping to the old collar radius externally, it will need adjustment.

---

## Next Steps

- Post-merge: check vending machine slot fit (consider reducing slot inner radius or adjusting bottle x-offset in the machine grid)
- Post-merge: verify `customLabel` chip text reads at act-tools scale=0.7 with the neck-emboss position
- Phase L (lighting) will warm the scene which should help the liquid's emissive glow read even better
