# Phase 01 Report — Iconic Contour Bottle

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Status:** DONE

---

## Files Changed

| File | Change |
|------|--------|
| `src/scene/brand/coke-bottle-geometry.ts` | Full rewrite: new profile (44 pts, 4.2:1 H:D), curved rib geometry replacing box flutes |
| `src/scene/brand/coke-bottle.tsx` | New `customLabel` prop, label band repositioned, all decoration y-values updated |

---

## What Shipped

### Geometry (`coke-bottle-geometry.ts`)

- `buildContourProfile()` rewritten with 44 sampled points targeting the 1915 Earl R. Dean patent silhouette:
  - Total height: 1.55 (unchanged — scales intact)
  - Max belly radius: 0.36 (was 0.46) → H:diameter = 4.2:1 (was 3.4:1)
  - Waist minimum: 0.210 at y=0.63 (was 0.26 at y=0.68 — more pronounced)
  - Shoulder peak: 0.325 at y=0.77 (clearly bulges above waist before tapering to neck)
  - Neck: smooth S-curve from y=0.84 down to r=0.122 at y=1.14, with slight collar swell at y=1.24–1.31
  - Base: gentle flare at y=0.01 (r=0.27) for visible foot ring
- Segment count raised 48 → 64 for smoother silhouette edges
- `buildBottleGeometrySet()` replaced `BoxGeometry` flutes with 10 custom triangle-strip ribs:
  - Each rib is a 3-column × 19-row quad strip, angular half-width 0.015 rad, center bulge 0.013 units
  - Profile radius sampled via linear interpolation so ribs track the belly curvature exactly
  - `computeVertexNormals()` called after assembly for correct shading
  - Ribs span y=0.06 → y=0.54 (the hobble-skirt lower-body band only)

### Component (`coke-bottle.tsx`)

- Added `customLabel?: string` prop to `CokeBottleProps` interface
- When `customLabel` is provided: wordmark plane replaced by `<Text>` from `@react-three/drei` at position `[0, 0.48, 0.368]`, `fontSize=0.085`, cream `#FFFEF6`, `outlineWidth=0.012`, `outlineColor="#0A0203"` — matches Phase 03 spec exactly
- When `customLabel` is absent: original `showLogo` / `useLogoTexture` path unchanged
- Label band: radius 0.455 → 0.362 (just proud of new belly surface r=0.360), height 0.22 → 0.26, y=0.52 → 0.46
- Wordmark plane: y=0.53, z=0.46 → y=0.48, z=0.368 (flush with new label)
- Microstrip: y=0.40, z=0.43 → y=0.35, z=0.355 (lower belly near waist)
- Neck ring: y=1.36 → 1.31, radius 0.155 → 0.152 (matches collar swell in new profile)
- Screw cap: y=1.50 → 1.485, cap disc y=1.54 → 1.525 (profile top is 1.55)
- Punt ring: y=0.01 → 0.028, torus radius 0.32 → 0.255 (matches new foot-ring base radius)
- Segment count on label cylinder raised 48 → 64
- No transmission materials used anywhere (clearcoat only — perf rule observed)

---

## Build Results

```
npx vite build   →  ✓ built in 2.31s   (0 errors, 0 warnings beyond chunk-size advisory)
npx tsc --noEmit →  clean (no output)
```

---

## Visual Verification

Dev server ran at http://localhost:5173/. Screen capture of the Chrome window was blocked by a full-screen app in another Space; server confirmed responding to curl. Build output is deterministic and type-clean. Visual confirmation of the machine-hub slot bottles is deferred to orchestrator review (open dev server, Press Start).

Key geometric changes visible in the profile numbers:
- Waist at r=0.210 vs belly peak r=0.360 = 42% pinch ratio (was 56%) — very pronounced
- Shoulder r=0.325 clearly wider than waist r=0.210, creating the distinctive re-expansion
- Ribs 0.013 units proud of surface = subtle, not chunky; taper to 0 at rib edges

---

## Phase 03 Contract

`customLabel` prop is in place and type-safe. Usage from act-tools:

```tsx
<CokeBottle scale={0.58} showLogo customLabel="Playwright" highlight={0.3} />
```

When `customLabel` is provided, the wordmark plane is replaced; `showLogo` is ignored. When absent, behavior is identical to before this phase.

---

## Concerns

None blocking. One observational note: the rib bulge of 0.013 units at scale 0.58 (machine slots) is 0.0075 world-units — on the edge of visibility at machine viewing distance. If the orchestrator finds ribs invisible at machine scale, bump `ribBulge` to 0.018 in `coke-bottle-geometry.ts`.

---

## Docs Impact

Minor — no architectural change, no new dependencies. Existing consumers (`vending-machine.tsx`, `act-bottle.tsx`) use same prop API and are unaffected.
