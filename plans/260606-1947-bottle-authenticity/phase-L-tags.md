# Phase L — Tools-act neck-tag readability

**Files owned:** `src/scene/acts/act-tools.tsx`

## Why

The crate's paper neck-tags (procedural CanvasTextures hung from each bottle's neck) are too small to read at the chapter camera distance. The user explicitly called out "viewability of the words" as bad.

## Tasks

### 1. Locate the tag builder in `act-tools.tsx`

Find `buildNeckTagTexture(name)` (or equivalent — search for where the tag CanvasTexture is constructed). It's called inside a `useMemo` that iterates `tools.map((t) => buildNeckTagTexture(t.name))`.

### 2. Bump canvas resolution

Current canvas is likely 256×192 or similar. Bump to **512×384**. Set `texture.anisotropy = 8` (or `renderer.capabilities.getMaxAnisotropy()` if reachable — otherwise hardcode 8) for sharp reading at angle.

### 3. Bigger, higher-contrast text

In the canvas drawing:
- Background: aged cream `#EAD8B0` (slightly more saturation than current — period paper tone)
- Border: dark ink rectangle outline at ~6px stroke
- Text: dark ink `#1A1408`, font `bold 80px "Courier New", monospace` (or a serif typewriter feel)
- Center the text both axes
- Add a tiny "TOOL" stamp at the top in smaller red text (`bold 28px serif`, color `#A60010`, letter-spacing `4px`) for period feel

### 4. Bigger tag plane

Find the JSX where the tag is rendered as a plane. Current is probably ~`[0.18, 0.11, 0.005]`. Bump to **`[0.32, 0.20, 0.005]`** (~ 2× area).

### 5. Reposition

- Hang the tag slightly off the neck (in z forward) so it doesn't clip the bottle's glass
- Position it just below the new crown cap (the Phase B work makes the cap thinner, so the neck top moves up slightly — verify the tag y is right around y=1.10–1.15 in bottle-local units, then adjusts via the bottle's scale)

### 6. Twine ring

If the twine ring radius needs adjustment for the new neck dimensions, tighten it.

## Acceptance criteria

- Tool name on each tag clearly readable without a viewer zooming in
- No tag clips the bottle glass
- `npm run build` passes; tsc clean
- All 6 tags render with correct tool names from `data/portfolio-content.ts → tools`

## Out of scope

- Don't change anything outside `act-tools.tsx`
- Don't change the bottle component (Phase B's domain)
- Don't change the crate frame, planks, stencil, spotlight, or animation
- Don't change the tool data
