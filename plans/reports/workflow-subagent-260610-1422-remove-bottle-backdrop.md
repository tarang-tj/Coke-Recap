# Remove backdrop platform from recap coke bottle

- File edited: `src/scene/recap/coke-bottle.tsx` (only file touched)
- Verified shipped GLB first (`npx @gltf-transform/cli inspect public/assets/models/cocacola-bottle.glb`): both mesh name `Cube_Background_0` (12 tris) AND material name `Background` survived meshopt compression.
- Fix: in useMemo clone step, traverse + collect meshes matching `/background/i` on mesh name OR material name(s) (handles material arrays), then `removeFromParent()` each AFTER traverse (no mid-traverse mutation). Removal happens BEFORE Box3 normalization so center/foot/scale are measured on bottle only. Comment added explaining Sketchfab backdrop constraint.
- Component API unchanged; shadow flags / scaling logic untouched (shadow traverse runs after removal, so backdrop can't cast).
- `npm run typecheck` passes.
- Note: GLB also contains `Plane.002_Material.002_0` (2 tris) and `Text_Text_0` meshes — left intact per task scope (only background matched).
- Visual verification: downstream.
