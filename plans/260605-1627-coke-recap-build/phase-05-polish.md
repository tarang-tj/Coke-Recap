# Phase 5 — Polish

**Mode:** sequential
**Status:** pending
**Depends on:** Phase 4

## Goal
Production-grade feel: loader, accessibility, mobile, perf.

## Steps
1. **Loader** — Custom drei `<Loader>` styled as a bottle-shaped silhouette filling vertically with Coke red. Disappear with a 250ms fade once all assets parsed.
2. **Reduced motion** — `src/hooks/use-reduced-motion.ts` returns `prefers-reduced-motion`. Pipe into camera rig (skip dolly, hard-cut between acts), fluid environment (freeze bubbles, dampen noise), nebula (freeze arcs).
3. **Reduced motion toggle** — `src/ui/reduced-motion-toggle.tsx`, fixed top-right, gear icon, persisted to `localStorage`.
4. **Skip intro button** — top-right, jumps scroll to start of Act 3 (Agent).
5. **Mobile tuning** —
   - DPR clamp to 1.5.
   - Particle counts decimated.
   - Disable refraction on glass cubes (use plain frosted material).
   - Touch-scroll inertia override if rubber-banding looks broken.
6. **Section overlays** — final typography pass; fluid `clamp()` sizing; check contrast.
7. **Lighthouse pass** — target ≥90 on Performance, Accessibility, Best Practices, SEO.
8. **Meta tags** — title, description, OG image (rendered at 1200×630 of the cold-open act).

## Acceptance
- Lighthouse mobile: ≥90 across the board.
- Reduced motion fully respected.
- No console errors or warnings on prod build.
- All sections keyboard-navigable.
