# Phase B — bottle profile + dark liquid + glass tint

**Files owned:**
- `src/scene/brand/coke-bottle.tsx`
- `src/scene/brand/coke-bottle-geometry.ts`

## Why

User: *"the bottles youre making, it feels elongated above the half of the
bottle also the shape and everythign still doesnt look good. the liquid for
coke also shouldnt be gray it should blackish."*

Two compounding failures:
1. Belly peak sits at y=0.44 of 1.55 → 28% from base → 72% of the bottle
   is above the belly. Reference shows belly at ~40% from base. The upper
   section IS too long by 12 percentage points.
2. Liquid at `#3D1E0F` (medium caramel) mixed with the very transparent
   light-gray glass reads as washed-out gray-brown. Real Coke in a bottle
   reads near-black.

## Tasks

### 1. Profile rewrite in `coke-bottle-geometry.ts`

Rewrite `buildContourProfile()` with ~70 sample points hitting these landmarks:

```
Base flare:
  (0.18, 0.000)  foot edge
  (0.20, 0.020)  foot ring bevel
  (0.21, 0.040)  foot ring top
  (0.215, 0.080) base transition

Lower hobble-skirt belly rise:
  (0.22, 0.120)
  (0.235, 0.180)
  (0.250, 0.250)
  (0.260, 0.330)
  (0.267, 0.420)
  (0.270, 0.500)

Belly peak (sustained):
  (0.270, 0.560)  <-- BELLY PEAK starts
  (0.270, 0.620)  <-- peak position
  (0.270, 0.680)  <-- still wide
  (0.265, 0.720)  <-- belly starts narrowing

Upper belly to waist:
  (0.250, 0.760)
  (0.230, 0.790)
  (0.215, 0.815)  <-- WAIST pinch

Shoulder bulge:
  (0.220, 0.840)
  (0.230, 0.880)
  (0.225, 0.910)  <-- SHOULDER peak
  (0.215, 0.940)

Neck taper:
  (0.185, 0.970)
  (0.155, 1.010)
  (0.135, 1.050)
  (0.128, 1.100)
  (0.125, 1.160)
  (0.125, 1.230)
  (0.128, 1.300)

Neck collar:
  (0.135, 1.360)
  (0.140, 1.400)
  (0.135, 1.450)

Top rim:
  (0.125, 1.500)
  (0.115, 1.550)
```

Total: 30+ key landmarks; expand to ~70 by adding smooth intermediate samples
between each segment for cubic-feel curvature.

Verify in build: `buildContourProfile()` returns an array of `THREE.Vector2`
sorted by y ascending, monotonic (no overlap), with no duplicate points.

Lathe segments stay at 96. Update the rib `buildBottleGeometrySet`:
- Rib y range: 0.06 → **0.65** (was 0.54) — extends through the new sustained
  belly so flutes are visible across the full hobble-skirt section
- Rib bulge: 0.013 (unchanged)
- Rib count: 10 (unchanged)
- The rib radius lookup uses the new `profileRadiusAt(profile, y)` helper —
  no changes needed to that function

### 2. Liquid geometry rewrite

In `buildLiquidGeometry()`:
- Liquid `yStart`: 0.06 (unchanged — just above the foot ring)
- Liquid `yEnd`: 1.05 → **0.96** (just below the new neck taper)
- Inset: 0.012 inside the body profile (unchanged)
- Same lathe segment count: 64

Verify: the liquid lathe radius at the meniscus y matches the body's profile
radius at that y, minus 0.012 inset.

### 3. Material changes in `coke-bottle.tsx`

```diff
- const GLASS_COLOR = '#DCE0DC';        // very light gray, near clear
+ const GLASS_COLOR = '#D0DDD2';        // faint green-blue (real Coke glass tint)

- const LIQUID_COLOR = '#3D1E0F';       // deep caramel cola brown
- const LIQUID_EMISSIVE = '#3D1E0F';    // warm inner glow
+ const LIQUID_COLOR = '#0A0503';       // very dark, near-black (real Coke reads black)
+ const LIQUID_EMISSIVE = '#1A0D05';    // very subtle warm interior glow

- const LIQUID_EMISSIVE_BASE = 0.18;
- const LIQUID_EMISSIVE_HIGHLIGHT = 0.45;
+ const LIQUID_EMISSIVE_BASE = 0.05;
+ const LIQUID_EMISSIVE_HIGHLIGHT = 0.18;
```

In the glass body `meshPhysicalMaterial`:
```diff
- opacity={0.18}
+ opacity={0.22}
```

In the meniscus disc material:
- Keep the cream-amber emissive intensity around 0.4 — the meniscus is the
  light-on-surface highlight and should stay bright. Color `#7A4519` keep.

### 4. Decoration positions

Adjust to match new profile:

| Decoration | Old y | New y | Notes |
|---|---|---|---|
| `MENISCUS_Y` | 1.06 | **0.96** | matches new liquid top |
| `MENISCUS_R` | 0.082 | **≈0.143** | derive from `profileRadiusAt(profile, 0.96) - 0.012` |
| Upper-neck embossed wordmark | 0.95 | **1.20** | mid-neck cylinder (between shoulder and collar) |
| Neck ring torus | 1.31 (or wherever it sits) | **1.40** | matches new collar position |
| Crown cap (`CAP_Y`) | 1.50 | 1.50 | unchanged (top rim still at 1.55) |
| Base punt ring (`buildBasePunt` if any) | various | **adjust to ~0.21** | matches new foot ring radius |

Verify `profileRadiusAt(profile, 1.20) + 0.005` for the embossed wordmark z
position (sit on bottle's front face at y=1.20).

### 5. Verify consumers

DO NOT touch consumer files. After changes, build the project and visually
verify:
- Vending machine slot bottles render with new silhouette + dark liquid
- Tools-act crate bottles render with new silhouette + dark liquid
- Takeaways hero bottle renders cleanly

If any consumer breaks structurally (geometry-mismatch error, etc.), report
it but do NOT fix it in this phase.

### 6. `CokeBottleProps` API

UNCHANGED. All props preserved by name and behavior:
- `scale`, `lift`, `highlight`, `showLogo`, `customLabel`, `interior`,
  `reducedMotion`, `onPointerOver`, `onPointerOut`, `onClick`
- `highlight` still drives the liquid's `emissiveIntensity` (now with darker base)
- `interior` still accepted but no-op (liquid always renders)

## Acceptance

- Belly peak visibly higher in the silhouette (~40% from base — less elongated above)
- Liquid reads as near-black with a subtle warm hint at the meniscus
- Glass has a faint green-blue tint
- `npm run build` passes; tsc clean
- All consumers still render
- No transmission materials

## Out of scope

- Don't touch any consumer file
- Don't add bubbles, condensation, or other interior animation
- Don't touch the crown cap geometry/material (those are fine)
- Don't change the `highlight` prop semantics
