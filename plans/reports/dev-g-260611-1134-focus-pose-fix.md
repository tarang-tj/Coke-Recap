# Focus Pose Fix — camera-rig collapsed framing

## Problem
Flat 30% push toward look target broke agent view: camera moved from x=40 to x≈20.5,
putting the ConsumerFunnel (x=32) behind the lens. All views felt over-zoomed.

## Fix (src/scene/camera-rig.tsx)

- Added `ViewPose = Pose & { focus?: Pose }` — optional per-view collapsed target.
- `POSES` record typed as `Record<ViewId, ViewPose>`.
- `agent` view gains an explicit `focus` pose:
  - pos: [38, 2.2, -17.5] — stays near base x, tiny z pull-back for depth
  - look: [5, 2.0, -16.5] — swings look-target right to frame both funnel (x=32)
    and insights network (x=14) simultaneously
- Generic default push fraction reduced 30% → 15% (gentle lean-in for role/tools/takeaways).
- Focus logic: if `viewPose.focus` exists, set `_targetPos`/`_targetLook` directly to
  it; else apply 15% push. Single damp3 downstream — no second spring.
- All scratch vectors reused (no per-frame allocation). `_pushDir` still used for
  generic-push path.

## Scripts/verify-collapse-toggle.mjs
Upgraded to accept argv: `[hash] [output-prefix]` and `SHOT_BASE_URL` env var.
Defaults: hash=role, prefix=plans/reports/lvl13-verify-role, base=http://localhost:5173.
Now shoots expanded + collapsed + reexpanded screenshots for any view.

## Screenshots (port 5174)
- `lvl13-g-agent-collapsed.png` — funnel bottom-right + network mid-frame, both clear
- `lvl13-g-agent-expanded.png` — base pose unchanged, street corridor depth intact
- `lvl13-g-role-collapsed.png` — Consumer Pulse + Market Insights fill frame, clean lean
- `lvl13-g-tools-collapsed.png` — globe + pipeline bench well-framed
- `lvl13-g-takeaways-collapsed.png` — growth ribbon arc across roofline, appropriate pull

## Build
`npm run build` (tsc -b + vite build): PASS — ✓ built in 1m 3s

## Files Modified
- `src/scene/camera-rig.tsx` — focus pose system
- `scripts/verify-collapse-toggle.mjs` — argv + env upgrades
