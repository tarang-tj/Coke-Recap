# Growth Ribbon — TAKEAWAYS exhibit

New file: `src/scene/growth-ribbon.tsx` (exports `GrowthRibbon`). app.tsx NOT touched (verified byte-identical to HEAD after temp-mount revert).

## What it is
Luminous warm-gold growth arc (1886 -> today) over the rooftops for the takeaways pull-back: TubeGeometry r=0.18 along a CatmullRomCurve3, meshBasicMaterial toneMapped=false + additive blending, opacity ~0.85. Five milestone markers (Billboard dot + halo, Html pill df=45): 1886 Jacobs' Pharmacy, 1899 first bottling plant, 1915 contour bottle, 1971 Hilltop, TODAY ~1.9B servings. "ILLUSTRATIVE — PUBLIC MILESTONES" plate near the start. Pulse = drei dashed Line over the same curve, `material.dashOffset` mutated in useFrame (zero allocs) + faint tube opacity breathing. Reduced motion: runner not mounted, static glow. Whole group returns null unless `view === 'takeaways'`.

## Deviations from brief (deliberate, screenshot-driven)
1. **X mirrored**: takeaways cam ([0,17,-50] looking +Z) puts world -X on SCREEN-RIGHT (same gotcha documented in metrics-display.tsx). Brief's literal coords rendered growth DESCENDING left->right. Curve runs +X -> -X so it ascends on screen.
2. **Span trimmed to x +4 -> -26** (brief ±34): DOM probe showed both end pills off-frame (x=-58 / x=1288) and left milestones buried UNDER the chapter-overlay quote rail (quotes cover x<~450, y~270-490; drei Html renders below DOM UI). Arc now lives on the open stage right of the rail; all pills probe-verified in-frame, non-overlapping (per-milestone pillDy rows).

## Verification
- `npm run typecheck` clean (before + after revert).
- Temp-mounted in app.tsx; puppeteer DOM probe of pill rects + screenshots `/tmp/ribbon-final-takeaways.png` (ribbon + 5 pills + plate, zero console errors) and `/tmp/ribbon-home.png` (NO ribbon, zero console errors). Temp mount then reverted surgically — `git checkout` avoided because sibling agents had live uncommitted app.tsx edits (MartechPipeline/ConsumerFunnel churn observed mid-session).
- Transient `ConsumerFunnel is not defined` page error seen ONCE mid-verification = sibling's component mid-edit, not this exhibit; final shots clean.

## For integrator
`import { GrowthRibbon } from './scene/growth-ribbon';` + `<GrowthRibbon />` in SceneContent.

Unresolved: none blocking. Optional polish: tube radius/colour tuning if the golden-hour grade changes.
