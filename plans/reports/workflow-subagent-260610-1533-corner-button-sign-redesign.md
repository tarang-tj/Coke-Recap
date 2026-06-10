# Corner button-sign redesign — report

## Probe findings (pristine Coca-Cola.glb)
- White banner below disc = `Blade` (CokeRed) + `Blade_rim` (White) + `Blade_tx` (White text), z 2.8–5.8 on the Ph_corner pillar. **No objects named SignBG/SignTx exist anywhere in the GLB** — script comment about them is stale; Blade trio is unambiguous, no shopfront sign risk. App src has zero refs to Blade names.
- Disc original: rim x 3.55–6.65, z 5.05–8.15, face plane y≈4.7. Cornice z 11.4.
- Lamp_6 group x 6.5–7.1 (hat projected within 0.3 m of rim right edge from home cam). Tree_leaf.050 = top ball of back-street tree at (15,−14) (Tree_trunk.010 + leaves .050–.054); canopy projection deeply overlapped lower-right rim (−1.44 m).

## Changes (scripts/level-up-diorama-design.py, fix_layout)
- DELETE Blade/Blade_rim/Blade_tx (`bpy.data.objects.remove`, do_unlink).
- SIGN_RAISE 1.5 → **0.2** (disc ctr z 6.6→6.8; rim bottom 5.25 > every lamp-hat top 5.14, under cornice).
- LAMP6_DX = **+2.0 m** in x: LampPost/Globe/LampArm/LampHat/LampBase _6.
- TREE_DX = **+4.5 m** in x: whole tree (trunk.010 + leaves .050–.054) so canopy stays intact. 3.0/3.5 were insufficient — far bbox corners project at smaller scale (leaf .052 tangent at 3.5).
- New `check_corner_sightline()`: projects occluder bbox corners from home cam (−8,34,7 Blender) onto disc plane, min point-segment distance vs rim circle. Needs `view_layer.update()` first — stale matrix_world was the first-run gotcha.
- Sign close-up preview camera moved onto the home ray: (−0.8,17.9,6.9) → (5.1,4.68,6.8).

## Verification
- Full headless run exit 0; all sightline checks OK: lamp +2.69..+6.05 m, tree balls +0.55..+1.63 m (conservative bbox corners).
- Renders: /tmp/diorama-after-sign.png (disc at natural 2nd-floor bracket height, no banner, nothing crossing; wire passes behind disc), /tmp/diorama-after-wide.png (corner clean from home pose), crops /tmp/zoom-wide-disc.png, /tmp/zoom-sign-arm.png.
- GLB JSON: no Blade nodes; Btn_disc translation [0,0.2,0]; LampPost_6 [2,0,0]; Tree_leaf.050 (19.5,5.04,14); 30 animations, 16 PNG images, Btn_logo_m intact. 7.94 MB.

## Unresolved
- Stale comment in awning section still references "SignBG/SignTx fascias" (no such objects); left untouched — awning logic out of scope.
- Moved lamp (x≈8.8) stands in cross-street mouth (it already did at 6.8); looks fine in renders.
