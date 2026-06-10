# Metrics stand (ROLE) + drifting clouds — done

## New files
- `src/scene/metrics-display.tsx` (197 ln) — diegetic "MARKET INSIGHTS" wood+brass stand, 5-bar stylized chart. Public figures only: ~1.9B daily servings, 200+ countries, ~94% logo recognition, ~$4B ad spend, 5¢ 1886–1959. Caption plate "Illustrative — public figures". Bars rise staggered (MathUtils.damp ease-out, ref-driven, zero per-frame allocs) on entry to `role`; reduced-motion = instant full. Html pills gated to `view === 'role'`, distanceFactor 5.5, staggered rows to avoid pill collisions.
- `src/scene/drifting-clouds.tsx` (96 ln) — 6 billboard planes, 3 seeded CanvasTexture blob variants (#FFF2E2), opacity 0.22–0.34, depthWrite off, toneMapped off, x-drift 0.05–0.11 u/s w/ wrap at ±95; reduced-motion = static. Textures disposed on unmount.

## Edited
- `src/app.tsx` — mounted `<MetricsDisplay />` + `<DriftingClouds />` in `SceneContent()` fragment (only edit).

## Key placement finding
ROLE camera looks +Z → camera-right is **world -X**. Brief's start pos [4.6,0,-5.2] landed behind the left DOM caption. Final: pos `[1.1, 0.05, -6.8]`, rot.y `2.62` (front +Z local yawed back to camera). Stand sits screen-right, clear of caption + soda fountain + bottom nav.

## Verification
- `npm run typecheck` — clean (twice, incl. final state).
- Screenshots via `.shot-diag.mjs`, no console errors / failed requests all runs.
- Role: stand legible, pills staggered no overlap — `plans/reports/levelup-11-role-metrics-stand.png` (+ crop `levelup-11-role-metrics-crop.png`).
- Home: clouds visible-but-subtle vs baseline `levelup-1-home.png` — `plans/reports/levelup-11-home-clouds.png`. Note: first home shot of session showed dark-red sky — anomaly from two concurrent headless browsers mid-arrival-fade, NOT a regression; re-shot solo matches baseline grade.

## Unresolved
- Cloud drift + bar-rise animation verified by code review only (stills can't show motion).
- Reduced-motion path code-reviewed, not screenshotted.
