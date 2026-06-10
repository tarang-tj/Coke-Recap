# Diorama v2 integration + full app verification

## GLB pipeline
- Source: ~/Desktop/Coca-Cola-detailed.glb (8.02 MB, mtime 14:42 — fresh)
- resize 2048x1152 -> /tmp/d1.glb (7.82 MB), then meshopt -> /tmp/diorama-v2.glb (2.64 MB, 2,637,552 bytes). In expected 2-3 MB band.
- Old GLB backed up /tmp/diorama-v1-backup.glb (2.43 MB). New copied to public/assets/models/coca-cola-diorama.glb.
- meshopt warns "quantize: Skipping TEXCOORD_0; out of [0,1] range" (tiled brick UVs) — benign, UVs preserved uncompressed.

## Verification (dev 5173, .shot-diag.mjs + throwaway .shot-recap.mjs grid-click sweep)
All 5 runs: zero console errors, zero failed requests.

- a PASS — button disc clean, no lamp/tree beam through face, white-on-red script legible (/tmp/crop-disc.png)
- b PASS — awnings storefront height, snug to facades, Coke fascia white-on-red seated on awning top (/tmp/crop-awning.png, /tmp/crop-street.png)
- c PASS — red/brown brick flanking blocks w/ aged tonal variety, Jacobs' Pharmacy cream, medallion white-on-red, wagon ad red-on-cream, no green panels (/tmp/crop-brick.png)
- d PASS — MARKET INSIGHTS stand screen-right of caption, pills legible (1.9B/200+/94%/$4B/5c), fountain + DOM clear (/tmp/crop-metrics2.png)
- e PASS — subtle cream cloud puffs in dusk sky, chimney smoke plume, wagon mid-street (/tmp/crop-cloud2.png, /tmp/crop-wagon.png)
- f PASS — recap bottle no backdrop slab, label intact, natural frame (/tmp/crop-bottle.png)
- g PASS — diagnostics clean across home/role/tools/takeaways/recap

## Verdict: PASS. No rollback needed; backup retained at /tmp/diorama-v1-backup.glb.

Unresolved Qs: none.
