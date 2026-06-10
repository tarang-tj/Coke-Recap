# Level-up: recap story mode + nav reach + resilience

**Status:** ✅ complete — PR #8 open, awaiting user merge · **Branch:** `polish-pass-6` · **Mode:** auto (user: "level up the hell out of the project")

All six phases shipped + a seventh found during verification: SSAO had been
silently inactive in production (missing `enableNormalPass`) — fixed.
16/16 prod-preview checks pass; code-review H1/H2/M1 findings fixed
(`plans/reports/code-review-260609-2010-level-up.md`).

## Why

The flagship coin→bottle recap dead-ends at `role` copy; chapters are unreachable on
touch devices (pill nav only renders inside chapter views; home offers keys 1-4 only);
arrow keys during the recap silently cancel it (NavigationProvider window listener);
music fetches ~5 MB eagerly at page load even when toggled off; drag free-look is dead
on iOS (`movementX`=0 for touch); no fallback when WebGL init fails.

## Phases

1. **feat(recap): story pager** — `recap-panel.tsx` becomes 5 pages:
   intro (hero/tagline) → Role → Stack → Agent → Takeaways, reusing the existing
   section components via a new shared `src/ui/sections/section-registry.tsx`
   (labels + components, single source of truth with `chapter-overlay.tsx`).
   Footer pager + progress dots; ←/→ page, 1-4 jump, ESC close — registered
   **capture-phase** with `stopPropagation()` so the NavigationProvider bubble
   listener can't hijack/cancel while the recap is active (also during
   coin/dispense).
2. **feat(nav): chapter pills on home** — `chapter-overlay.tsx` shows the bottom
   selector on the machine view too (hidden while recap is running); hint copy
   updated. Fixes the mobile dead-end.
3. **fix(camera): touch free-look** — `camera-rig.tsx` computes drag deltas from
   `clientX/Y` (not `movementX/Y`); add `pointercancel`.
4. **perf(audio): lazy music** — `music-toggle.tsx` constructs the `Audio`
   element on first `(started && on)` play; zero bytes fetched before Press
   Start or when music is off.
5. **feat(ui): WebGL fallback** — new `src/ui/webgl-fallback.tsx` error boundary
   around the canvas layer; DOM fallback with role/org/tagline, learnings,
   contact links.
6. **chore(meta): OG refresh** — regenerate `public/og-image.jpg` from the
   bottle-reveal frame (1200×630) in `vite preview`; update `og:image:alt`.

## Verification (prod bundle only — `vite preview`, never dev)

- `npm run build` clean.
- Puppeteer against preview: home (pills + beacon), recap intro/page-3/page-5
  (contact links), ESC restores machine, ArrowRight from idle home still enters
  `role`, mobile 390×844 tap path, no `.m4a` request before Press Start.
- code-reviewer subagent on the full diff before PR.

## Out of scope

Vehicle re-rig, git history purge (`filter-repo`), Jacobs' Pharmacy Blender
scene, recap↔chapter camera entanglement (deliberate decoupling stands).
