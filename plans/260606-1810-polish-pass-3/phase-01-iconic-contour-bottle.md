# Phase 01 — Iconic contour bottle

**Priority:** P0 (blocks Phases 02 & 03)
**Status:** pending
**Files (owned):** `src/scene/brand/coke-bottle-geometry.ts`, `src/scene/brand/coke-bottle.tsx`

## Why this matters

User: *"the bottle looks horrendous / squished."* Current `buildContourProfile()` lathe profile is technically 3.4:1 H:diameter but reads wide. The real 1915 hobble-skirt patented contour bottle has a more dramatic waist pinch, a fuller shoulder bulge, and a softer base flare. We're missing the recognizable silhouette by a noticeable margin.

## Target silhouette (reference numbers)

Reference: US Patent 1923-D77,834 (Earl R. Dean). Aim for these ratios — **height-to-max-diameter ≈ 4.2:1**, not 3.4:1.

Approximate landmarks (in current local units where current total height = 1.55):
- Total height: keep at ~1.55 (others scale to it)
- **Max belly radius: drop from 0.46 → ~0.36** (slimmer overall)
- **Waist pinch: drop from 0.26 → ~0.21** at y ≈ 0.62 (more pronounced)
- **Shoulder bulge: raise from 0.36 → ~0.32 at y ≈ 0.82** — should clearly bulge above the waist before tapering into the neck
- **Neck taper: smoother S-curve** from shoulder down to neck ring (y 0.85 → 1.30)
- **Base flare: slightly more pronounced** at y 0.0 → 0.1 (the foot ring)

## Tasks

1. **Rewrite `buildContourProfile()`** with 30–40 sampled points that hit the landmarks above. Use cubic-ish curvature (smoothly interpolated radii), not the current piecewise-linear-feel. The flutes belong to the lower hobble-skirt (y 0.0 → 0.55 range), not painted on top.
2. **Treat flutes as real geometry, not box-stamps.** Replace the current 10 `BoxGeometry` flutes with one of:
   - Vertical ridge bumps modulated INTO the lathe profile (small radial oscillation in the y 0.0 → 0.55 band — produces the ridged look directly in the silhouette), OR
   - 10 thin curved lathes around the lower body that bulge outward by ~0.01–0.015. Pick whichever reads better; aim for subtle vertical ribbing, not chunky boxes.
3. **Bottle component (`coke-bottle.tsx`) cleanups while you're in there:**
   - Resize the label band cylinder to match the new belly geometry (currently r=0.455; may need ~0.38 with the new profile). It must sit flush — not float over the glass.
   - Verify the wordmark plane, "ORIGINAL TASTE" microstrip, neck ring, screw cap, and base punt ring still sit at correct y positions for the new profile. Adjust the y values as needed; **do not delete these decorations.**
   - Keep `showLogo` prop and the `useLogoTexture` integration intact.
   - **Add a new optional prop `customLabel?: string`** to override the wordmark plane with a flat `<Text>` reading `customLabel` instead. This is the hook Phase 03 will use for Tools-act tool names. When `customLabel` is provided, the wordmark plane should be replaced by the text (same position, same outline treatment as elsewhere — cream color, dark outline).
4. **Materials:** keep `clearcoat` (no transmission — perf rule). Glass color, emissive, label red can stay.
5. **Test render:** export a test scene or add a temporary `<CokeBottle />` to one act and screenshot. Verify silhouette reads as a real Coke bottle from the front and from a 30° angle.

## Acceptance criteria

- New silhouette visually matches the patented hobble-skirt contour (slimmer waist, fuller shoulder, smoother neck taper).
- Flutes read as subtle vertical ribbing, not floating boxes.
- All decorations (label band, wordmark, microstrip, neck ring, cap, punt ring) sit flush at correct positions.
- `customLabel` prop works: when passed, the wordmark plane is replaced by 3-D Text reading that string.
- `npm run build` passes. Dev-server screenshot shows the new bottle in the vending-machine slots.

## Out of scope

- Don't touch the vending machine cabinet (Phase 02)
- Don't touch any act files (Phase 03)
- Don't change the `useLogoTexture` hook

## How to verify

```bash
npm run build        # must pass
npm run dev          # open http://localhost:5173
# Press Start. Bottles should look noticeably more iconic in the machine slots.
```

Take a screenshot of the machine-hub view and a screenshot of the Takeaways view (which uses CokeBottle as the hero). Both should clearly read as the real Coke bottle.

## Risk

- Lathe profile changes may shift the belly outward at unexpected y positions, causing decorations to clip. Test incrementally.
- Replacing flute boxes with bumps-in-profile changes how the geometry merges with the body — keep `frustumCulled` defaults; don't disable culling unless you have a specific reason.
