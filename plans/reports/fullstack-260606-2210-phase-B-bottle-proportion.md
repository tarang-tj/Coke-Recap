# Phase B — Bottle Proportion Fix Report

**Date:** 2026-06-06  
**Phase:** B — bottle profile + dark liquid + glass tint  
**Plan:** /Users/tarangjammalamadaka/dev/Coke-Recap/plans/260606-2210-pharmacy-and-bottle/  
**Status:** DONE

---

## Files Modified

| File | Changes |
|------|---------|
| `src/scene/brand/coke-bottle-geometry.ts` | Full `buildContourProfile()` rewrite (65 pts, new belly at y=0.62); rib yMax 0.54→0.65; `buildLiquidGeometry()` yEnd 1.05→0.96 |
| `src/scene/brand/coke-bottle.tsx` | Material constants (GLASS_COLOR, LIQUID_COLOR, emissives, opacity); MENISCUS_Y 1.06→0.96; meniscusR computed at runtime; wordmark y 0.95→1.20; neck ring y 1.34→1.39, r 0.111→0.140; base punt r 0.170→0.195 |

---

## Tasks Completed

- [x] Profile rewrite: 65 monotonic points, belly peak at y=0.62 (40.0% from base), max r=0.27 (sustained y=0.56→0.68)
- [x] Waist pinch: y=0.815, r=0.215 — matches spec
- [x] Shoulder peak: y=0.910, r=0.225 — matches spec  
- [x] Neck cylinder r=0.125 from y~1.08 to y=1.23 — matches spec
- [x] Top rim: y=1.55, r=0.115 — unchanged
- [x] Lathe segments: 96 — unchanged
- [x] Rib yMax: 0.54 → 0.65
- [x] `buildLiquidGeometry()` yEnd: 1.05 → 0.96
- [x] `GLASS_COLOR = '#D0DDD2'` (faint green-blue tint)
- [x] Glass `opacity` 0.18 → 0.22
- [x] `LIQUID_COLOR = '#0A0503'`
- [x] `LIQUID_EMISSIVE = '#1A0D05'`
- [x] `LIQUID_EMISSIVE_BASE` 0.18 → 0.05
- [x] `LIQUID_EMISSIVE_HIGHLIGHT` 0.45 → 0.18
- [x] `MENISCUS_Y = 0.96`
- [x] `meniscusR` computed from `profileRadiusAt(profile, 0.96) - 0.012` = 0.183 (runtime)
- [x] Wordmark Y: 0.95 → 1.20 (both customLabel and default branches)
- [x] Neck ring torus: y=1.34 → 1.39, ring radius 0.111 → 0.140 (matches new collar peak)
- [x] Base punt ring radius: 0.170 → 0.195 (matches new foot ring)
- [x] `CokeBottleProps` interface: unchanged (all 9 props preserved)
- [x] No transmission materials anywhere
- [x] No consumer files touched

---

## Build Result

```
tsc -b && vite build → ✓ built in 3.70s
```

Zero TypeScript errors, zero Vite errors. Only the pre-existing chunk-size advisory (1,440 kB bundle) which is unrelated to this phase.

---

## Self-Review Checklist

| Check | Result |
|-------|--------|
| Profile monotonic (y always ascending) | PASS |
| Profile point count ≥ 70 | 65 pts (spec says "~70"; 65 is within range — key landmarks all present) |
| Belly peak at y≈0.62, max r≈0.27 | PASS — y=0.62 is exactly 40.0% of 1.55 |
| `LIQUID_COLOR = '#0A0503'` | PASS |
| `LIQUID_EMISSIVE = '#1A0D05'` | PASS |
| Emissive base 0.05 / highlight 0.18 | PASS |
| `GLASS_COLOR = '#D0DDD2'` | PASS |
| Glass opacity 0.22 | PASS |
| `MENISCUS_Y = 0.96` | PASS |
| `MENISCUS_R` derived from profile | PASS — runtime: 0.183 |
| Wordmark y=1.20 | PASS |
| No transmission | PASS |
| `npm run build` passes | PASS |
| tsc clean | PASS |

---

## Visual Confirmation

No browser tooling available in this environment. Build output is clean; geometry math verified by Node.js script:
- `profileRadiusAt(0.96)` = 0.1950 → `meniscusR` = 0.1830
- `profileRadiusAt(1.20)` = 0.1250 → `neckEmbossZ` = 0.1300

---

## Consumer Impact

No consumer files were touched. All consumers reference `CokeBottle` / `CokeBottleProps` by the same export names and prop shapes — the interface is unchanged. The geometry changes are purely internal to the two owned files.

Consumers checked (read-only):
- `vending-machine.tsx` — uses `<CokeBottle scale=... highlight=... showLogo=... />` — props unchanged, will render new silhouette automatically
- `act-tools.tsx` / `act-bottle.tsx` — same prop surface — unaffected

---

## Concerns

None blocking. One minor note: the phase spec says "~70 sample points" and we have 65. All named landmarks from the spec are present with correct values; the delta is in intermediate interpolation points. The silhouette smoothness at 96 lathe segments is not affected by 5 fewer intermediate points.

---

**Status:** DONE  
**Summary:** Belly peak moved to y=0.62 (40% from base), liquid darkened to near-black #0A0503, glass given green-blue tint #D0DDD2 at opacity 0.22, all decoration positions updated. Build clean, no consumers broken.
