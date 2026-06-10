# Diorama defect fixes + brick realism (260610)

File changed: `scripts/level-up-diorama-design.py` only. Output GLB re-exported to `~/Desktop/Coca-Cola-detailed.glb` (8.02 MB).

## Diagnosis (probes: raycast grid from home-pose cam + bbox/vertex dumps)
1. "Beam through floating sign": NOT a crossarm. Two visual offenders at disc z 6.6: dark `LampPost_6`/`Globe_6` crosses disc face from street views; olive `Tree_leaf.050/.051` (back street, y -14) pokes through the cross-street gap at the disc's lower rim from the home pose. Disc's own `CornerArm` bracket is intentional.
2. Awnings (`*_awn` + 2 `*_awnbr` each) lay at ankle height (z 0.41) and floated 0.6 m off facades (back edge y 3.71); valances orphaned at z 1.78. Fascias at z 2.74–3.36.
3. Brick/Brick2/3/4 base colors were all pure white -> whole street baked cream. Walls (shells/pilasters) already carry Brick* materials; `Stone` is only trim (bands/sills/keys/frames) — so "convert Stone walls" was done as per-variant brick albedos + object-level variant swaps (intent preserved: ~44% of the 9 main-street facades now red/brown, hero cream).

## Fixes (all in new `fix_layout()` right after import + pattern/bake tweaks)
- Sign: `Btn_disc/Btn_rim/Btn_logo/CornerArm` +1.5 z. Geometry-checked: rim (r 1.55, ctr z 8.1) clears projected tree-top (1.8) and lamp (top 5.05); below cornice 11.4; 0.75 gap above Blade sign.
- Awnings (Pharmacy/Annex/East1/West4): slab+brackets dy -0.55, dz +1.97 (back-top edge -> y 3.16, z 2.72, tucked under fascia bottom 2.74); valance dz +0.11 (top 2.05 = relocated lip). `Coke_fascia` decal untouched — its bottom (z 2.635) lands exactly on the relocated slab top (~2.647). SignBG/SignTx all >= 2.74, clear.
- Brick realism: Color2 0.72->0.58 (per-brick variety), mortar darker aged (0.55,0.52,0.46) + Mortar Smooth 0.6->0.25 + size 0.007, low-freq weathering mottle (noise 1.7, desat dark stop 0.72) + fine grain (noise 13), brick bump 0.35->0.5, brick normal-map strength 0.8->1.0.
- Historic palette: `BRICK_BASE` = Brick cream (hero), Brick2 Victorian red, Brick3 red-brown, Brick4 warm buff. `BRICK_SWAP` object-level: Annex->Brick4, West3->Brick2, East3->Brick4 (mesh users==1 verified; guard in code). Street W->E: cream, RED, BROWN, buff, CREAM HERO, buff, RED, BROWN, buff.

## Verification (full re-run, exit 0, no `!!` warnings)
- Log: 1306 objects, 70 materials, 30 actions; 10 tiles baked; UVs on 469 meshes; export OK.
- Renders: /tmp/diorama-after-sign.png (disc clean), /tmp/diorama-after-awning.png (awning seated, Coke fascia logo riding it), /tmp/diorama-after-brickwall.png (East1 aged red brick + cream trim), /tmp/diorama-after-wide.png + /tmp/crop-disc-after.png (home pose: disc clear of tree/lamp, scene reads the same, pharmacy cream).
- Constraints held: no renames, no transform_apply, decal meshes untouched (only object location on Btn_logo), PNG textures.

## Unresolved Qs
- Web pipeline (resize + meshopt -> public assets) not run — out of scope per file ownership.
- Valance bottom now at z 1.73 (period-plausible, matches author's proportions); flag if too low in-app.
