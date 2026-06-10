# Consumer-journey funnel exhibit — THE AGENT view

**Status:** DONE
**Component:** `ConsumerFunnel` (named export) — NEW `src/scene/consumer-funnel.tsx` (own file only; app.tsx untouched — integrator mounts after `<MetricsDisplay />` / `<GrowthRibbon />` in SceneContent).

## Final transform
- `POS = [32, 0, -20.2]`, `ROT_Y = 1.14` (plinth front +Z local faces agent cam at [40,2.2,-16.5])
- ~1.7 m tall incl. brass top frame; funnel stack tops at y≈1.60
- Placement rationale: agent DOM caption owns upper-left, so exhibit sits on the empty pavement camera-RIGHT of the street sightline, ~8.5 m out — reads mid-right frame, street/rails + vehicle corridor (z≈-16.5) unobstructed
- z=-20.2 keeps ~1 m+ clearance from the home→agent damp3 camera chord (passes [32, 3.0, -19.4])

## Design (matches metrics-display.tsx conventions)
- Dark-wood plinth + brass corner posts/top square/axle/finial; brass caption plate
- 4 truncated cones (cylinderGeometry, 24 seg), top→bottom: AWARENESS 100% cream, CONSIDERATION 38% buff, PURCHASE 12% #bd0a0d, LOYALTY 5% deep red emissive 0.45 — illustrative figures, plate pill "Consumer Journey — Illustrative"
- Stack spins 0.15 rad/s (static under reduced motion); 9 emissive droplets (3 per gap) via ONE instancedMesh, phase-offset loop, module-level dummy Object3D — zero per-frame allocations; useFrame early-returns unless view==='agent' && !reduced
- Html pills (distanceFactor 8) per tier, header + plate pills — all gated to view==='agent'
- `raycast={() => null}` on group AND every mesh/instancedMesh

## Verification
- `npm run typecheck` clean (before and after revert)
- /#agent screenshots (4 iterations: /tmp/agent-funnel-1..4.png): start coords [22,0,-13.2] landed under the DOM caption and read too small at 18 m → moved to [32,0,-20.2]; pills legible, funnel tiers + colors read, plate plaque on plinth
- Home + #takeaways shots: no pill leakage, exhibit unobtrusive in wide shots
- Zero console errors / failed requests on all shots
- app.tsx temp mount reverted via precise Edits, NOT `git checkout` — file carried a sibling agent's uncommitted GrowthRibbon work (and MartechPipeline churn) during this session; verified post-revert diff contains only sibling lines

## Unresolved
- None blocking. Drips are subtle (~1-2 px) at the agent distance — intentional ("tiny"); bump sphere radius 0.022→0.03 if more visibility wanted.
