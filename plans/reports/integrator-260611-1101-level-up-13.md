# Integrator — level-up 13: collapsible story panel + exhibit visibility + cinematic framing

Branch `level-up-13` off `main` (post PR #20 merge). 4 parallel agents, disjoint file ownership; B/C/D interrupted at permission prompt AFTER edits landed but before reports — integrator verified + finished their work.

## What shipped

**A — collapsible story panel** (`src/ui/chapter-overlay.tsx`)
- Slim vertical "story/hide" tab at left edge of chapter views; collapses text column + scrim + home logo as one unit (0.3s fade/slide)
- Module-level flag persists across chapter switches; default expanded
- aria-expanded round-trip verified in headless Chrome (`scripts/verify-collapse-toggle.mjs`, kept as a verify tool)
- Collapsed role view: full diorama + both exhibit stands clearly visible (`lvl13-verify-role-collapsed.png`)

**B — exhibit visibility, role+agent** (`metrics-display`, `consumer-pulse`, `consumer-funnel`, `insights-network`)
- Dark label plates + gold/near-white text, bigger pills (distanceFactor 7→6 etc.), thicker chart geometry, brighter bloom-friendly emissives
- Html pill count NET ZERO (8 added / 8 removed — consolidation only)

**C — exhibit visibility, tools/takeaways/home** (`martech-pipeline`, `global-reach-globe`, `growth-ribbon`, `place-analytics`)
- Same treatment; growth-ribbon year plates + home place-pins much more legible (see before/after `lvl13-c-*.png`)

**D — cinematic framing + accents** (`camera-rig.tsx`, `view-accent-lights.tsx`)
- Conservative per-view lookAt nudges seating exhibits in the right ~55% of frame (machine wide pose + RECAP_POSE untouched)
- Accent lights 3 → 7 (constant count, always mounted, no shadows): exhibit glow pools for role/tools/agent + first-ever takeaways accent (ribbon mid-arc uplight)

## Verification
- Real gate `npm run build` (tsc -b && vite build) — PASS
- All 5 views screenshot (`lvl13-verify-*.png`) + collapse/expand interactive round-trip
- Perf discipline survived: settle flags intact (consumer-pulse), globe single instancedMesh + explicit boundingSphere intact, no new always-running useFrame work, light count constant
- Content policy: all figures generic/illustrative, plates intact

## Unresolved
- SwiftShader headless can't resolve FPS deltas — confirm feel on real hardware after merge
- Phonograph levels still need a human ear (carry-over)
