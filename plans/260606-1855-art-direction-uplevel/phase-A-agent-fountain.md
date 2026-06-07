# Phase A — Agent motif: chrome soda-fountain dispenser

**Priority:** P1
**Files owned:** `src/scene/acts/act-agent.tsx`

## Why

The current agent visualization (glowing red icosahedron + 3 orbital rings + 8 data dots) reads as "generic 3D abstract" — fine, but not memorable and not specific. The chapter copy is *"Turning dashboards into conversations"* + three pillars *Ingest / Analyze / Surface*. Personify the agent as a real-world Coca-Cola-era object that "serves" things: a vintage chrome soda-fountain dispenser. The pillars become engraved brass nameplates on three pull-handles. The agent literally dispenses insight.

## Motif spec

A **chrome 1950s soda-fountain dispenser** (the cylindrical chrome tower with multiple pull-handles) standing on a **tiled diner counter**, with **three pull-handles labeled Ingest / Analyze / Surface** on engraved brass nameplates. A small **red dome light** on top. A subtle drip occasionally falls from the currently-active handle. Cycles which handle is "active" every ~3s.

### Components

1. **The dispenser body**:
   - Main column: tall cylinder `<cylinderGeometry args={[0.55, 0.6, 1.8, 32]}>`. Polished chrome `meshStandardMaterial color="#D6D2CA" roughness=0.12 metalness=0.92`.
   - Slightly tapered top dome: `<sphereGeometry args={[0.55, 24, 12, 0, Math.PI*2, 0, Math.PI/2]}>` positioned at top of column. Same chrome material.
   - Base: a wider chrome ring `<cylinderGeometry args={[0.75, 0.8, 0.12, 32]}>` at the bottom — looks like a heavy plinth.
   - Tiny chrome rivets around the column (8 small spheres at top + bottom in a ring) for period detail.

2. **The three pull-handles**:
   - Three identical handle assemblies, distributed at angles 0°, 120°, 240° around the column at y = 0.4 (chest-height for a 1.8-tall column).
   - Each handle assembly:
     - **Spout**: short angled chrome cylinder pointing slightly down-and-outward, `<cylinderGeometry args={[0.06, 0.06, 0.32, 12]}>` rotated so it angles outward and slightly down.
     - **Handle/lever**: a black bakelite-look knob at the end of the spout, sphere `<sphereGeometry args={[0.08, 12, 8]}>` color `#1A1816` `roughness=0.6`.
     - **Brass nameplate**: small box `[0.32, 0.09, 0.015]` mounted on the column just above the spout. Material: `meshStandardMaterial color="#B89668" roughness=0.4 metalness=0.7`. Drei `<Text>` on it engraved-style: pillar name in serif uppercase, color `#3A2406`, font size 0.04.
   - Names from `src/data/portfolio-content.ts → agent.pillars` — 3 items: `Ingest`, `Analyze`, `Surface`.

3. **Red dome light on top**:
   - A small dome at the very top of the dispenser, `<sphereGeometry args={[0.18, 24, 16, 0, Math.PI*2, 0, Math.PI/2]}>` positioned at y ≈ 1.05.
   - Material: `meshStandardMaterial color="#F40009" emissive="#F40009" emissiveIntensity={2.2} roughness=0.35 transparent opacity={0.95}`. Acts as a beacon "now serving" indicator.
   - A small **pulse**: emissiveIntensity oscillates 2.0 → 2.6 on `Math.sin(elapsed * 1.4)`.

4. **The tiled diner counter** (the surface the dispenser sits on):
   - A rectangular plane `[3.2, 0.06, 2.4]` at y ≈ -0.85.
   - Procedural CanvasTexture: small checkerboard of cream `#F1E9DA` and brand-red `#A60010` 6"-ish tiles. Subtle grout lines `#5A1212`.
   - `meshStandardMaterial roughness=0.3 metalness=0` — the polished tile look. HDR env (Foundation phase) gives subtle reflection.

5. **Active-handle cycle + drip**:
   - An internal state `activeIdx ∈ {0,1,2}` cycles every ~3s.
   - The **brass nameplate of the active handle** glows: lerp its color toward emissive cream `#FFF6E0` and emit a small light bloom on it. Non-active plates are matte brass.
   - **Drip effect**: a tiny red sphere (`<sphereGeometry args={[0.035, 8, 8]}>` color `#A60010` `emissive="#A60010" emissiveIntensity=0.7`) appears at the end of the active spout, falls under gravity for ~700ms, then disappears just above the counter. Cycle pause between drips ~ 1.5s. Reduced motion: no drip, no cycle (active stays at index 0).

### Lighting

- The Foundation phase's 3-light scene baseline lights this object.
- Add **one local chrome-accent spot light**: `<spotLight position={[2, 3, 2]} angle={0.6} penumbra={0.7} intensity={2.0} color="#FFE4B5" distance={6}>` aimed at the dispenser to catch the chrome highlights.
- Add **one red rim from below**: `<pointLight position={[0, -0.5, 0]} intensity={0.9} color="#F40009" distance={3}>` for an upward red wash on the underside of the dome.

### Layout

- The whole `<group>` is at approximately `[0.7, 0, 0]` so the chapter copy column on the left has clearance.

### Motion

- Slow rotation around Y: `group.rotation.y += dt * 0.04` (very slow — about 2.3°/sec) when not reduced.
- Subtle Y bob: `group.position.y = 0.015 * Math.sin(elapsed * 0.55)`.
- Reduced motion: no rotation, no bob, no drip, no pulse, no cycle.

### Envelope behavior (preserve)

- `g.visible = envelope > 0.002`
- `g.position.z = lerp(1.5, 0, envelope)`
- `g.scale.setScalar(0.6 + 0.4 * envelope)`

### Hover

- Hovering the dispenser brightens the red dome (emissiveIntensity 2.2 → 3.0 with lerp) and accelerates the cycle (3s → 1.5s between switches). Cursor → pointer; clears on out / envelope drop.

## Acceptance criteria

- `npm run build` passes, runtime console clean.
- Agent chapter shows a chrome soda-fountain dispenser on a tiled diner counter, with three brass-nameplated pull-handles (Ingest / Analyze / Surface), a red dome light on top, gentle pulse + occasional red drip from the active spout.
- HDR env (Foundation phase) gives the chrome real reflections.
- No transmission materials.
- No more glowing icosahedron + rings combo.

## Out of scope

- DO NOT touch any other file.
- Bottle component, vending machine, navigation, camera — untouched.
- No chapter copy edits.

## Verification

Open dev server, press 3 to navigate to Agent. The dispenser should sit on the tiled counter with chrome catching environment reflection, dome light pulsing red, active handle's brass plate glowing on a ~3s cycle.
