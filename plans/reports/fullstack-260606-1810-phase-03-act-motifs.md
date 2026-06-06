# Phase 03 Implementation Report — Inner-Act Motifs

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Status:** DONE

---

## Files Modified

| File | Change |
|---|---|
| `src/scene/acts/act-role.tsx` | Emissive trim + frustumCulled audit |
| `src/scene/acts/act-tools.tsx` | Full rewrite: chips → ToolBottle contour bottles |
| `src/scene/acts/act-agent.tsx` | Drop ribbons + nebula shader; clean brand-red icosahedron; DOT_COUNT 16→8 |

---

## Tasks Completed

- [x] **Act-Role:** Hover emissive target lowered 0.65 → 0.5. Added `frustumCulled={false}` on the cap cylinder mesh (the instancedMesh already had it; cap body did not).
- [x] **Act-Tools:** Removed `CanLabelChip` + `RoundedBox`. Replaced with `ToolBottle` component rendering `<CokeBottle scale=0.55 customLabel={label} showLogo={false} highlight={highlight} />`. Ring CIRCLE_RADIUS=2.4, 6 bottles, label-face-outward orientation via `facingY = π/2 − angle`. Preserved slow ring rotation (frame-rate-independent: `dt * 0.072`), highlight cycle every ~1.4 s, hover radial-lift + cursor change, reduced-motion guard. Ring nudged +0.6 on X to clear chapter scrim.
- [x] **Act-Agent:** Dropped both `<DynamicRibbon>` instances (lines 289–304). Removed nebula shader (`nebulaVert`, `nebulaFrag`, `uniforms`, `nebulaMat` ref, `shaderMaterial` JSX). Replaced with `<meshStandardMaterial color={COKE_RED} emissive={COKE_RED} emissiveIntensity={1.5} transparent={false} />` on the existing `icosahedronGeometry args={[0.7, 2]}`. Added per-frame emissive pulse (lerp toward `1.5 + 0.4 * sin(t * 1.8)` reduced-motion safe). Trimmed `DOT_COUNT` 16→8 with updated `DOT_SEEDS`. Kept `Billboard` import (still used by OrbitalRing labels). Kept all 3 OrbitalRing instances unchanged.

---

## Build Result

```
tsc -b && vite build
✓ 645 modules transformed.
✓ built in 2.34s
```

No type errors. No new warnings. Pre-existing chunk-size advisory (1420 kB main bundle) is unchanged — not introduced by this phase.

---

## Implementation Notes

### Highlight prop wiring (act-tools)
`CokeBottle` internally uses `hRef.current = highlight` (runs on re-render). Driving it from a mutable ref in `useFrame` would freeze emissive at initial value. Solution: `ToolBottle` maintains `highlightValRef` (lerped per-frame) and syncs to React `useState` only when the snapped value drifts >0.01 from current state. This produces ~4–8 re-renders per transition cycle rather than 60/s, keeping emissive animation smooth with minimal re-render cost.

### Rotation rate
Previous code used `group.rotation.y += 0.0012` (assumed 60 fps). Replaced with `dt * 0.072` (0.0012 × 60) for frame-rate-independent rotation.

### No transmission materials
All materials in the three files are `meshPhysicalMaterial` (clearcoat, no transmission) or `meshStandardMaterial`. Rule upheld.

---

## Runtime Observation

Dev-server visual check was not performed (no screenshot tooling available in this session). Logic verified against CokeBottle API, portfolio-content.ts tool count (6), and act file structure.

---

## Concerns

None blocking. One observation: `ToolBottle` group position-lerping (`group.position.lerp(target, 0.12)`) after ring rotation means the lift direction is in the ring's local frame — radial outward is computed from the original `angle` at construction, which remains correct since the ring rotates as a whole group and each bottle's initial position stays consistent relative to the ring's local axes.

---

## Next Steps

- Orchestrator should do visual review on dev server (Role → Tools → Agent cycle).
- If label text on bottles clips at small scale, bump `fontSize` in CokeBottle's customLabel `<Text>` from `0.085` to `0.10` (that's in `coke-bottle.tsx`, not owned by this phase — flag for Phase 01 owner or a follow-up tweak).
- Phase 04 (Credit HUD) is independent and can proceed.
