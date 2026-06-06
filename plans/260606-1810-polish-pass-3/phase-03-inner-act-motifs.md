# Phase 03 — Inner-act motifs

**Priority:** P1
**Status:** pending — **blocked on Phase 01**
**Files (owned):** `src/scene/acts/act-role.tsx`, `src/scene/acts/act-tools.tsx`, `src/scene/acts/act-agent.tsx`

## Why this matters

User: *"the inner act visuals feel just-Coca-Cola random and are glitching through other objects."* Each chapter's centerpiece needs to read as **a single intentional motif** with no overlap or clipping into the camera/other meshes.

## Hard constraint

**Tools-act = chip-labeled bottle silhouettes (Option B), NOT generic chip cards.** User explicitly chose to preserve the contour bottle as the motif because of its historical weight. The "chip" is the bottle's label band carrying the tool name.

## Per-act tasks

### Act-Role (`src/scene/acts/act-role.tsx`)

- Keep the crimped bottle cap. It's already the right motif — one floating cap.
- **Clipping audit.** Current cap radius 1.1 + flute ring at 0.97. Verify nothing clips into the camera pose or the chapter overlay scrim. Tighten z bounds: ensure the cap's max forward z (after the `position.z = lerp(1.5, 0, envelope)` motion) doesn't pass z = 0 toward camera.
- Set `frustumCulled={false}` on the cap and `instancedMesh` if removing makes things flicker on enter (the current code already has it on the instancedMesh — verify the cap mesh too).
- The `Coca-Cola` wordmark text on the cap face is good — leave it.
- Trim emissive intensity slightly if the cap glow bleeds into bloom too aggressively (drop hover target from 0.65 → 0.5).

### Act-Tools (`src/scene/acts/act-tools.tsx`) — main rewrite

- **Replace `CanLabelChip` with `ToolBottle`:** a `<CokeBottle />` at `scale ≈ 0.55` arranged on the same ring (CIRCLE_RADIUS = 2.4).
- Pass each bottle the tool name via the new `customLabel` prop added in Phase 01. The bottle's label band displays the tool name instead of the wordmark.
- **Orient each bottle so its label band faces outward** (radially from the center). The existing `circleAngle()` helper + facingY math gives you the angle.
- **Preserve all behavior:**
  - Ring rotates slowly when active (`group.rotation.y += 0.0012` if not reduced).
  - One bottle highlighted per ~1.4s cycle (the `highlightedRef` logic).
  - Hover lift (radial outward) + emissive brighten + cursor change.
  - Reduced-motion respected.
- **Clipping audit.** With 6 bottles each height ≈ 1.55 × scale 0.55 ≈ 0.85 tall on a 2.4-radius ring, they should not collide. But verify the chapter overlay scrim doesn't paint over the left-most bottle. If a bottle ends up too far left (behind the chapter copy column), shift the whole `groupRef` to `position.x = 0.6` to nudge the ring right.
- **Light scaling.** Keep the existing 3 pointLights (cream, caramel, red) — they should flatter the bottles.
- Tool count is 6 (`tools` array in `data/portfolio-content.ts`). Don't add or remove items.

### Act-Agent (`src/scene/acts/act-agent.tsx`)

- The plan-3 scope called for "glowing brand-red orb with orbital data rings." Current implementation has an icosahedron with a nebula shader + 3 rings + 16 data dots + 2 ribbons. **It's busy.** Simplify:
  - **Drop the two `<DynamicRibbon>` instances** (lines 289–304). They contribute to the "everything is Coke-flavored" randomness.
  - **Replace the nebula shader on the core with a clean brand-red glowing icosahedron.** Use `meshStandardMaterial` with `color={COKE_RED}`, `emissive={COKE_RED}`, `emissiveIntensity={1.5}`, `transparent={false}`. Keep the icosahedron geometry `args={[0.7, 2]}`.
  - **Keep the 3 orbital rings.** They are the data-rings motif the polish-pass spec named.
  - **Trim data dots from 16 → 8** to reduce visual noise.
- Remove the now-unused `nebulaVert` / `nebulaFrag` imports and `uniforms` / `nebulaMat` refs. Drop the `Billboard` import only if it becomes unused (it's used by ring labels — verify before deleting).
- **Clipping audit.** With the breathing scale `0.65 + 0.35 * envelope + 0.15 * peak` (max ~1.15) and outer ring at 1.9 → scaled ~2.18 radius. Verify nothing clips into the chapter copy column on the left. If it does, nudge `groupRef.position.x` right by 0.5.

### General

- **No new transmission materials** anywhere (perf rule).
- All meshes that move dramatically: confirm `frustumCulled` defaults work for the new sizes. Only disable culling when instance/manual matrix placement puts meshes far from their local bounds.

## Acceptance criteria

- Role-act: single clean crimped cap, no clipping, slightly tamer emissive.
- Tools-act: 6 mini Coca-Cola contour bottles on a ring, each labeled with a tool name on the label band. Ring rotates and cycles highlights. No clipping into the chapter scrim.
- Agent-act: brand-red glowing icosahedron core + 3 orbital rings + 8 data dots. Ribbons gone. Cleaner read.
- `npm run build` passes; runtime console clean.
- Dev-server screenshots of all three chapters shared with user.

## Out of scope

- Don't touch `act-bottle.tsx` (the Takeaways finale — already the hero bottle moment)
- Don't touch the camera-rig
- Don't change `portfolio-content.ts` data

## How to verify

```bash
npm run build
npm run dev
# Cycle through Role → Tools → Agent. Each should read as one clear motif.
# No clipping, no overlap with the chapter copy column, no glitchy z-fighting.
```

## Dependencies

- **Phase 01 must be merged** to this branch before dispatching this phase. Tools-act consumes the new `customLabel` prop on `<CokeBottle />`.
