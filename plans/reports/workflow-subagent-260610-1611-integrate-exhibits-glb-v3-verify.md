# Integrator: mount exhibits + GLB v3 swap + full verify (260610-1611)

## Changes
- `src/app.tsx`: +3 imports, +3 mounts in SceneContent() — `<MartechPipeline />`, `<ConsumerFunnel />`, `<GrowthRibbon />` after `<MetricsDisplay />`. File was clean before edit (sibling agents reverted temp mounts).
- GLB swap: Desktop/Coca-Cola-detailed.glb (fresh, 15:47) → resize 2048x1152 → meshopt → 2.62 MB → `public/assets/models/coca-cola-diorama.glb`. Backup of v2 at `/tmp/diorama-v2-backup.glb`.
- `npm run typecheck`: clean.

## Verification (node .shot-diag.mjs, all runs zero console errors / zero failed requests)
- a. Corner: button disc at natural 2nd-floor height, no banner below, nothing crossing (trolley wire passes behind). Crops: v3-home-disc.png.
- b. Machine logo crisp in both tools frames (4s apart, idle drift) — no shimmer/tear diff. Medallion+fascia white-on-red; motorcar ad red-on-cream (Car_ad_m). Crops: v3-tools-logo-a/b, v3-tools-fascia-a/b, v3-home-carad.png.
- c. Tools: MARTECH PIPELINE bench legible (DATA IN/INSIGHT/ACTIVATION + ILLUSTRATIVE plate); machine + beacon unobstructed.
- d. Agent: CONSUMER JOURNEY funnel prominent, 4 tier pills + ILLUSTRATIVE plate legible.
- e. Takeaways: growth ribbon arcs over rooftops, milestone pills 1886→TODAY legible; absent from home shot.
- f. Role: MARKET INSIGHTS stand present + legible (regression OK).

Screens: /tmp/v3-{home,role,tools,tools-b,agent,takeaways}.png + crops.

## Unresolved
- None. v2 backup retained at /tmp/diorama-v2-backup.glb if rollback ever needed.
