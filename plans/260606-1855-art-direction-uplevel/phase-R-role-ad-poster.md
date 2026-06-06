# Phase R — Role motif: vintage ad poster in shadow-box

**Priority:** P1
**Files owned:** `src/scene/acts/act-role.tsx`

## Why

The user has now rejected two iterations of this chapter (red cap with literal "Coca-Cola" text → magnifying lens over globe). Both read as too literal / too logo-stamped / too floating-symbol. The role is *Global Human Insights Intern at Coca-Cola* — i.e. someone who STUDIES brand artifacts to understand how marketing lands. Show that work through the artifact itself.

## Motif spec

A **vintage 1950s-style Coca-Cola advertising print** displayed in a **chrome shadow-box frame** lit from above like a museum piece. Slowly rotates ~3° around Y on a gentle ease. Reads as a curated brand archive piece, not a floating symbol.

### Components

1. **Shadow-box frame** (the case the poster lives in):
   - Outer rectangle: width 2.2, height 2.8, depth 0.18 — `RoundedBox args={[2.2, 2.8, 0.18]} radius={0.04}` with chrome material (`color="#C8C4BC"`, `roughness=0.18`, `metalness=0.88`).
   - Front recessed cavity: a smaller box subtracted/overlaid — or simply place a black-velvet inner backing plane at z = 0.06 sized `[2.0, 2.6, 0.01]`, `meshStandardMaterial color="#0A0203" roughness=0.85`.
   - Glass cover plane at z = 0.09 sized `[2.0, 2.6, 0.01]` — `meshPhysicalMaterial transparent opacity=0.12 clearcoat=1 roughness=0.05 metalness=0`. **No transmission** (perf rule). The glass should read by reflecting the HDR env (foundation phase).

2. **The poster** (the artwork inside):
   - Plane at z = 0.07, sized `[1.85, 2.45, 0.01]`.
   - **Painted procedurally** in the component using a CanvasTexture so we don't need an asset file. Draw:
     - Top: a thick red border / banner with cream text reading **"DRINK"** in extruded-feeling block caps
     - Middle: a stylized off-white silhouette / vignette area — leave it mostly empty or place a simple cream contour-bottle silhouette
     - Bottom: red banner with cream text reading **"COCA-COLA"** in the Pacifico script font (or fallback)
   - Use the existing `useLogoTexture` pattern as reference for CanvasTexture wiring — see `src/hooks/use-logo-texture.ts`. Create a new local hook or inline `useMemo(() => ...buildPosterCanvasTexture(), [])`.
   - Make the canvas 1024×1280 for crisp text. Cream background `#F1E9DA`, red blocks `#F40009`.
   - At the bottom in tiny tracking-wide text: **"DELICIOUS · REFRESHING"** for period flavor.

3. **Brass nameplate** at the bottom of the frame (outside the recessed area):
   - Small box `[0.7, 0.16, 0.02]` at the bottom front of the frame, color `#B89668` (antique brass), `roughness=0.4`, `metalness=0.7`.
   - `<Text>` on it (drei): `"GLOBAL HUMAN INSIGHTS"` in dark brown `#3A2406`, font size 0.05, letter-spacing wide.

4. **Spotlight from above** (museum lighting):
   - `<spotLight>` from `[0, 3.5, 2]` aimed at origin, intensity 4.0, color cream `#FFF6E0`, angle 0.55, penumbra 0.6, distance 8.
   - The spotlight casts toward the poster — should produce a soft falloff onto the frame and the contact-shadow plane below (Foundation phase provides the shadow plane).

### Motion

- Slowly rotates around Y: `group.rotation.y = 0.04 * Math.sin(elapsed * 0.4)` — that's ~2.3° peak swing, gentle.
- Subtle Y bob: `group.position.y = 0.04 * Math.sin(elapsed * 0.55)`.
- Under reduced motion: parked at a slight ~2° rotation, no bob.

### Envelope behavior (preserve)

- `g.visible = envelope > 0.002`
- `g.position.z = THREE.MathUtils.lerp(1.5, 0, envelope)` for entrance dive
- `g.scale.setScalar(0.5 + 0.5 * envelope)` for entrance scale-in

### Hover

- Hovering the frame slightly accelerates the rotation (sine frequency 0.4 → 0.7) and lifts the bob amplitude. Cursor → pointer; cleared on out AND when envelope drops.

## Acceptance criteria

- `npm run build` passes, runtime console clean.
- Role chapter shows a chrome-framed vintage-style Coca-Cola ad poster, lit from above, slowly rotating.
- Procedural CanvasTexture draws the poster (no external asset needed).
- Brass nameplate reads "GLOBAL HUMAN INSIGHTS".
- No literal "Coca-Cola" text on a flat disc anywhere.
- No transmission materials.

## Out of scope

- DO NOT touch any other file.
- DO NOT touch the vending machine, bottle, navigation, or camera.
- DO NOT add chapter copy.

## Verification

Open dev server, navigate to Role chapter via the 1 key. The framed poster should sit centered, gently rotating, with the spotlight catching the chrome rim.
