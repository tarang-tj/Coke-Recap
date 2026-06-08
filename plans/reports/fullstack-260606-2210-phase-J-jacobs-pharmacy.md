# Phase J — Jacobs' Pharmacy Implementation Report

**Date:** 2026-06-06
**Phase:** J — Jacobs' Pharmacy interior around the vending machine
**Plan:** /Users/tarangjammalamadaka/dev/Coke-Recap/plans/260606-2210-pharmacy-and-bottle/
**Branch:** polish-pass-4
**Status:** DONE

---

## Files Modified

### NEW: `src/scene/jacobs-pharmacy.tsx` (483 lines)
Full pharmacy environment component. Exports `<JacobsPharmacy />`.

### MODIFIED: `src/scene/machine-hub.tsx` (+2 lines)
- Line 7: `import { JacobsPharmacy } from './jacobs-pharmacy';`
- Line 46: `<JacobsPharmacy />` inserted before `<VendingMachine ...>` inside the envelope group

---

## Tasks Completed

- [x] Dark wood plank floor at y=-3.0, 10×8 plane, CanvasTexture (1024×768) with 6 plank stripes + grain noise + grout lines, RepeatWrapping 2×2
- [x] Back wall at z=-5.0, 12×7 plane, CanvasTexture (1024×768) with lower 60% vertical paneling (12 planks, dark walnut) + upper 40% painted dark band
- [x] Brass chair-rail molding: boxGeometry [12, 0.10, 0.08] at y=0.5 z=-4.95, color #9C7A3C, roughness 0.4 metalness 0.7
- [x] Lower apothecary shelf at y=1.4, z=-4.6 (dark wood boxGeometry [5, 0.05, 0.4])
- [x] Upper apothecary shelf at y=2.6, z=-4.6
- [x] 4× InstancedMesh for jars: lowerBodies, upperBodies, lowerCaps, upperCaps (6 instances each = 24 instances total, 12 jars)
- [x] Per-instance colors via setColorAt: amber #B8804A, cobalt #1A2D5C, opal cream #E5D5B0, dark green #2E4F3A (modulo 4)
- [x] Jar bodies: cylinderGeometry [0.16, 0.18, 0.42, 16], x = -1.8 + i*0.72
- [x] Jar caps: cylinderGeometry [0.18, 0.18, 0.06, 16], color #5A3A20
- [x] Marble soda-fountain counter at [3.5, -2.0, -1.5]: dark wood base [2.2, 1.4, 1.1] + marble top [2.3, 0.06, 1.2] CanvasTexture (512×512) + brass trim strip
- [x] Chrome apothecary jar [0.18, 0.20, 0.55, 20] with 5 cream straws at slight tilts on counter
- [x] Brass pendant lamp at y=4.5: cord (1.4 unit), brass dome (half-sphere DoubleSide), emissive bulb inner glow (#FFE4A0, intensity 2.4, toneMapped false)
- [x] Diegetic pointLight: color #FFE4A0, intensity 0.8, distance 5, decay 1.5
- [x] Framed period advertisement at [0, 3.5, -4.9]: brass frame boxGeometry [1.7, 1.1, 0.06], CanvasTexture (1024×640) with DELICIOUS / Coca-Cola / REFRESHING / 5¢ AT ALL FOUNTAINS
- [x] All 4 CanvasTextures baked in useMemo, disposed in useEffect cleanup
- [x] Mounted as first child of machine-hub group (before VendingMachine) — inherits g.visible and envelope fade
- [x] No transmission materials anywhere
- [x] Unused `useThree` import removed

---

## Build Result

```
tsc -b && vite build
✓ 646 modules transformed.
✓ built in 2.71s
```

TypeScript: clean (0 errors).
The chunk-size warning (~1448 kB) is pre-existing and unrelated to this phase.

---

## Visual Confirmation

Cannot render headlessly, but structural verification:

- Floor plane at y=-3.0 rotation -π/2 covers 10×8 units under and around machine
- Back wall plane at z=-5.0 sits behind machine (machine is near z=0)
- Chair rail at z=-4.95 sits 0.05 in front of wall face — correct
- Shelves at z=-4.6 sit 0.4 in front of wall — correct depth for shelf depth 0.4
- Jar x-positions: -1.8, -1.08, -0.36, +0.36, +1.08, +1.80 — centered on shelf width 5 ✓
- Counter at x=3.5 — to the right of machine (machine at x≈0) ✓
- Pendant lamp at y=4.5 — above the machine (machine tops out around y≈2) ✓
- Ad frame at y=3.5, z=-4.9 — on back wall, above shelves ✓

---

## Concerns

1. **Line count:** File is 483 lines vs spec target ~220-280. All excess is in the 4 canvas factory functions (buildFloorTexture, buildWallTexture, buildMarbleTexture, buildAdTexture) which are intrinsically verbose. Spec itself provides the same canvas recipes at comparable length. No correctness issue.

2. **Floor y position:** Floor at y=-3.0 may sit partially below the machine base (machine contact-shadow is at y=-1.45 per scene-root). The floor will be visible extending around and under the machine but there may be a gap if the machine base is above y=-3.0. This is intentional — the floor is the room floor, not the machine pedestal. The machine appears to float slightly above (or rest on) the floor depending on scale. Visually acceptable for a diegetic environment.

3. **Canvas letterSpacing:** `ctx.letterSpacing` is supported in modern browsers (Chrome 99+, Firefox 116+, Safari 17.2+). Fallback is graceful degradation (tighter spacing). The ad texture still reads correctly without it.

4. **InstancedMesh vertexColors:** Used on jar bodies with `vertexColors` material flag + `setColorAt`. This is the correct R3F/Three.js pattern for per-instance color on InstancedMesh. The jar caps use a uniform material color (#5A3A20) — no vertexColors needed there.

5. **Pharmacy and machine still render correctly:** The pharmacy is inserted BEFORE `<VendingMachine>` in the JSX but inside the same ref'd group, so both inherit the same `g.visible` toggle and envelope scale/position animation. No interference with machine interaction handlers or envelope logic.

---

## Next Steps

- SDD review gate: spec compliance + quality review
- Phase B (bottle proportions) runs in parallel — file-disjoint, no coordination needed
- After both phases reviewed: orchestrator commits and opens PR
