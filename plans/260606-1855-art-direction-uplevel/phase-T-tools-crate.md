# Phase T — Tools motif: wooden Coca-Cola crate

**Priority:** P1
**Files owned:** `src/scene/acts/act-tools.tsx`

## Why

User has rejected two iterations: ring of 6 chip cubes (bland), then 6 mini bottles on a ring (silhouettes), then a featured-bottle carousel with liquid/bubbles (mechanical). The pattern: every iteration leaned on motion to compensate for the lack of a SCENE. This phase ditches the carousel entirely and puts the bottles in a real-world container: the **historic Coca-Cola wooden bottle crate**.

## Motif spec

A **wooden Coca-Cola bottle crate** (the divided-grid wooden case, 24 slot capacity) on **aged wood planks** with **6 contour bottles standing in 6 slots** (leaving 18 slots empty). Top-down 3/4 view. Each bottle wears a **small paper neck-tag with the tool name** tied with twine. Single warm overhead spotlight. The whole crate gently rotates ~1°/s around Y. Still-life — no swap animation, no carousel.

### Components

1. **The crate**:
   - Outer frame: a hollow wooden box, dimensions approximately `[1.8, 0.55, 1.2]` (width × height × depth — slightly wider than tall, deeper than tall). Construct as 4 wall planes + a base plate using `<boxGeometry>` or `<RoundedBox>`.
   - **Wood material**: `meshStandardMaterial color="#7A4F2C"` (warm aged brown), `roughness=0.85`, `metalness=0`. Add subtle nail-head accents at corners (tiny cylinder spheres, copper `#9C6E3A`).
   - **Internal divider grid**: thin wooden walls creating a 6×4 = 24-slot grid. Each slot ~ 0.27 × 0.27 in plan. Dividers: thin boxes `[0.04, 0.45, 1.1]` running long-axis at 6 evenly spaced x positions, and `[1.7, 0.45, 0.04]` at 4 evenly spaced z positions.
   - **"Drink Coca-Cola" stencil on one long side**: paint via CanvasTexture on the outside of one wall. Aged cream/white stenciled letters with cracked-paint feel (use noise in the canvas alpha for distress). About 60% opacity.
   - **Iron strap reinforcements**: thin dark metal bands at top + bottom edges of the long walls. `meshStandardMaterial color="#2A2018"` `roughness=0.6` `metalness=0.4`.

2. **The bottles**:
   - Use the existing `<CokeBottle>` component (with the polish-pass-3 silhouette).
   - Place **6 bottles** in **6 of the 24 slots** — pick a visually balanced arrangement (e.g., 6 spread across the front row + middle row, leaving the back row mostly empty for visible depth into the crate).
   - Scale ~ 0.7 each. Slight per-bottle Y rotation jitter (±15°) for realism (bottles aren't perfectly aligned in a real crate).
   - **`showLogo={true}` on each — the trademark wordmark sits on the label band** (we're showing it as the brand artifact). Tool name goes on the neck-tag, not the bottle label.

3. **The neck-tags**:
   - A small **paper rectangle** tied around the neck of each bottle. About `[0.18, 0.11, 0.005]`, hung at y ≈ 1.20 (just below the cap of the new bottle).
   - **CanvasTexture for each tag** with the tool name in a typewriter / hand-stamped style (use a monospace fallback, dark ink on aged cream).
   - **Twine** — a thin torus (`torusGeometry args={[0.045, 0.004, 6, 16]}`) wrapped around the bottle neck where the tag hangs from. Color `#A88B5C`.

4. **Aged wood planks underneath**:
   - A floor plane sized `[5, 0.04, 4]` positioned at y ≈ -0.45 (below crate base).
   - Plank pattern via CanvasTexture: 6 horizontal stripes of varying brown shades + thin darker grout lines between them.
   - Material: `meshStandardMaterial roughness=0.95 metalness=0`. The HDR env (Foundation phase) provides reflection cues.

5. **Overhead spotlight**:
   - `<spotLight position={[1.5, 5, 2]} angle={0.6} penumbra={0.7} intensity={3.5} color="#FFE4B5" distance={10}>` aimed at the crate center.
   - This creates a warm "shaft" feel pulled forward by the bloom + grain from the Foundation phase.

### Layout & camera framing

- The whole `<group>` is positioned at approximately `[0.6, 0, 0]` so the chapter copy column on the left has clearance. Crate rotated `rotation={[0, -0.35, 0]}` so the camera sees a 3/4 view (front-right face + top down into the slots).

### Motion

- `group.rotation.y += dt * 0.018` (slow continuous rotation — adds about 1°/sec).
- Subtle bob: `group.position.y = -0.02 + 0.02 * Math.sin(elapsed * 0.55)`.
- Under reduced motion: no rotation, no bob.

### Envelope behavior (preserve)

- `g.visible = envelope > 0.002`
- `g.position.z = lerp(1.5, 0, envelope)`
- `g.scale.setScalar(0.6 + 0.4 * envelope)`

### Hover

- Hovering anywhere on the crate slows the rotation slightly (a "you're looking at it" feel) and brightens the spotlight intensity 3.5 → 4.2 with lerp. Cursor → pointer; clears on out / on envelope drop.

### Tool data

The data lives at `src/data/portfolio-content.ts → tools`. 6 entries: NIQ, PowerBI, DAX, SQL, Python, Internal Tooling. Iterate the array — don't hardcode.

## Acceptance criteria

- `npm run build` passes, runtime console clean.
- Tools chapter shows a wooden Coca-Cola crate with 6 contour bottles in 6 slots, 18 slots empty, each bottle with a paper neck-tag carrying a tool name.
- Crate sits on aged wood planks; spotlight from above; gentle rotation.
- HDR env (Foundation phase) is reflected by any chrome-ish elements (iron straps).
- No transmission materials.
- The historic contour bottle silhouette is preserved per user's hard requirement.

## Out of scope

- DO NOT touch the bottle component or the geometry.
- DO NOT touch any other act, the machine, or the navigation/camera.
- DO NOT change tools data.
- No carousel mechanics, no swap animation.

## Verification

Open dev server, press 2 to navigate to Tools. Crate should render with 6 labeled bottles, planks underneath, spotlit feel.
