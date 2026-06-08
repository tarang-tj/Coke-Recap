# Phase B — Pharmacy exterior + spatial entry sequence

**Files owned:**
- `src/scene/jacobs-pharmacy-exterior.tsx` (NEW)
- `src/scene/navigation-context.tsx` (modify — add `'exterior'` to ViewId)
- `src/scene/camera-rig.tsx` (modify — add exterior pose + animated entry)
- `src/ui/start-gate.tsx` (modify — button label "ENTER THE PHARMACY")
- `src/app.tsx` (modify — mount `<JacobsPharmacyExterior />`)

## Why

User confirmed Option A spatial sequence: title → exterior view of the pharmacy → click "Enter" → camera dollies through the door → existing machine view inside.

This makes the brand story diegetic: you visit Jacobs' Pharmacy in 1886, not "press start on a vending machine."

## Reference

- Jacobs' Pharmacy historical context: founded 1879 by Dr. Joseph Jacobs, located at Five Points (SW corner of Peachtree and Marietta Streets, Atlanta). Functioned as medicine shop + apothecary + general store + soda fountain. Coca-Cola first served here May 8, 1886.
- Visual: late-Victorian American commercial street, brick or wood facade, large display window onto the street, gold-leaf painted signage, awning, pharmacy/soda-fountain advertising painted on the storefront.
- Atmosphere: dusk, warm interior glow visible through the storefront window — a deliberate "the inside is alive" cue that motivates clicking Enter.

## Tasks

### 1. Create `src/scene/jacobs-pharmacy-exterior.tsx`

Exports `<JacobsPharmacyExterior />`. Renders the storefront as a single group. No animation needed (it's a still environment). Visible ONLY when `view === 'exterior'`.

Use `useSceneMixes()` (the scene-transition envelope) IF an `'exterior'` mix is added to scene-transition-context — but simpler: just gate the group's `visible` on `useNavigation().view === 'exterior'`.

The pharmacy exterior is a procedural composition of low-poly volumes meant to read as a Victorian commercial storefront, not photoreal. Composition is approximately:

```
                  ┌─────────────────────────────────┐
                  │  3-story brick upper floors     │
                  │  (vague window suggestions)     │
                  ├─────────────────────────────────┤
       Awning ──→ ╔═══════════════════════════════╗  ← Awning bar
                  │                               │
   Window  ───→   │ JACOBS' PHARMACY (gold leaf)  │
                  ├─────────┬───────────┬─────────┤
   Display    ───→│  Soda   │   Wooden  │   Drug  │
   windows       │ fountain│   door     │ apothec│
                  │  display│           │  display│
                  ├─────────┴───────────┴─────────┤
   Sidewalk  ───→  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Street  ───→   ───────────────────────────────────
```

Concrete elements:

1. **Building facade** — A wide procedural brick block (3-4 stories tall) at z = -10 to z = -8, x spanning -8 to +8, y from -1 to +6. Use a procedural CanvasTexture for the brick pattern (red brick `#7A2A1A` with cream mortar lines). Multiple windows on upper floors (small recessed boxes with cream curtains / dark interiors).

2. **Storefront ground floor** — The lower 2 units of the facade (y -1 to +1) hold the pharmacy storefront. Three vertical bays:
   - Left bay: display window (boxGeometry ~2 wide × 2 tall) with a faint warm-lit interior visible inside (a tiny apothecary jar silhouette + warm point light behind glass)
   - Center bay: the wooden door, slightly inset, ~1.4 wide × 2.4 tall with brass kick-plate, brass handle, small square window panes at top
   - Right bay: another display window mirroring the left
   - Glass: low-opacity meshPhysicalMaterial with clearcoat (NO transmission per perf rule)
   - Window frames: dark walnut wood `#3D2A1A`

3. **Awning** — A horizontal box `[7, 0.18, 0.8]` at y ≈ +1.2 spanning the storefront. Burgundy `#5A0010` (Coca-Cola adjacent) with cream scalloped trim along the front edge (small triangular cutouts via procedural texture or geometry).

4. **Painted signage** — Drei `<Text>` element on the awning face reading `JACOBS' PHARMACY` in a serif font, painted gold-leaf `#D4A847`, with a subtle dark drop-shadow text. Centered. fontSize ≈ 0.32.

5. **Side signage / subtitle** — Below the awning, a second smaller painted line on the building facade reading `SODA · FOUNTAIN · DRUGS` in chrome white `#F1E9DA`, smaller font.

6. **Sidewalk + street** — A flat plane in front of the building at y = -1 spanning the camera frame. Cream/gray cobblestone procedural texture. Optionally a gas-street-lamp at one side at x = +4, y = 0 to 3, with a warm emissive bulb.

7. **Warm interior glow** — Visible through the storefront windows: a single `<pointLight color="#FFE4A0" intensity={1.2} position={[0, 0, -9.5]} distance={3}>` placed behind the window glass + a couple of vague interior silhouettes (apothecary jars, shelves) at z = -9 to z = -8.5 catching the glow.

8. **Atmospheric backdrop above the building** — The existing scene-backdrop (red atmospheric gradient with dust motes) sits behind the building. The pharmacy occupies the lower-center of the camera frame; the atmospheric sky takes the top.

The pharmacy exterior group's center should be at world origin x=0, with the camera positioned to frame it. Use procedural CanvasTextures (brick, cobblestone) baked once in `useMemo`, disposed in `useEffect` cleanup with `colorSpace = SRGBColorSpace` (the Round-4 SDD lesson).

Total geometry budget: ~5k tris.

### 2. Modify `src/scene/navigation-context.tsx`

Add `'exterior'` to the `ViewId` type. Set initial view to `'exterior'`. The CHAPTERS array stays unchanged (chapters are still 4: role, tools, agent, takeaways).

```diff
- export type ViewId = 'machine' | 'role' | 'tools' | 'agent' | 'takeaways';
+ export type ViewId = 'exterior' | 'machine' | 'role' | 'tools' | 'agent' | 'takeaways';

  export const CHAPTERS: Exclude<ViewId, 'machine'>[] = ['role', 'tools', 'agent', 'takeaways'];
  // ^ this needs adjusting too:
+ export const CHAPTERS: Exclude<ViewId, 'machine' | 'exterior'>[] = ['role', 'tools', 'agent', 'takeaways'];

  export function NavigationProvider({ children }: { children: ReactNode }) {
-   const [view, setView] = useState<ViewId>('machine');
+   const [view, setView] = useState<ViewId>('exterior');
```

When `started` flips from false to true (the user pressed the gate button), automatically transition view from `'exterior'` to `'machine'`:

```tsx
useEffect(() => {
  if (started && view === 'exterior') {
    setView('machine');
  }
}, [started, view]);
```

The `goHome()` and `next()`/`prev()` handlers should still go to `'machine'` (not `'exterior'`) when Esc is pressed — the user shouldn't be able to "leave the pharmacy" once they've entered. Verify the existing logic handles this.

### 3. Modify `src/scene/camera-rig.tsx`

Add an exterior camera pose:

```ts
const EXTERIOR_POSE = {
  position: new THREE.Vector3(0, 1.8, 5.0),  // street level, 5 units back
  target: new THREE.Vector3(0, 1.8, -5.0),    // looking toward the storefront
};
```

When `view === 'exterior'`, the camera is at EXTERIOR_POSE.

When `view` transitions from `'exterior'` to `'machine'`, **animate** the camera over 1.6s with a cubic ease-in-out:
- Position lerp from EXTERIOR_POSE.position to MACHINE_POSE.position
- Target lerp from EXTERIOR_POSE.target to MACHINE_POSE.target

Use `useRef` for the transition state (active, progress 0-1, start time) and `useFrame` to advance the lerp. When progress reaches 1, mark transition complete.

Other view transitions (machine ↔ chapter views) remain instantaneous (current behavior).

Respect `useReducedMotion`: when reduced motion is set, skip the animation and snap to the target pose instantly.

### 4. Modify `src/ui/start-gate.tsx`

The Press Start button label changes from `Press Start` to **`Enter the Pharmacy`**. The button's behavior (calls `start()`, removes the gate) is unchanged.

```diff
-  <button onClick={start} ...>Press&ensp;Start</button>
+  <button onClick={start} ...>Enter&ensp;the&ensp;Pharmacy</button>
```

Also update the hint line below the button to reflect the new context:

```diff
- click&ensp;•&ensp;or press enter&ensp;•&ensp;or scroll
+ click the door&ensp;•&ensp;or press enter
```

The historical-tidbit caption below the hint (the `1886 · ATLANTA · INVENTED BY JOHN S. PEMBERTON` from Round 5) stays.

### 5. Modify `src/app.tsx`

Mount `<JacobsPharmacyExterior />` inside the SceneTransitionProvider children:

```diff
  <SceneTransitionProvider>
    <FluidEnvironment />
+   <JacobsPharmacyExterior />
    <MachineHub />
    <ActRole />
    <ActTools />
    <ActAgent />
    <ActBottle />
  </SceneTransitionProvider>
```

### 6. Credit HUD & chapter overlay verify

The `<CreditHud />` shows on title gate + machine view. With the new `'exterior'` view, the credit should ALSO be visible during the exterior view (it's still the home / hub-adjacent context). Check the visibility rule:

```ts
const show = !started || view === 'machine';
```

Update to:
```ts
const show = !started || view === 'machine' || view === 'exterior';
```

DO NOT need to modify `chapter-overlay.tsx` — the chapter selector is hidden when view==='machine', and we want it ALSO hidden when view==='exterior'. Verify the existing logic.

## Acceptance criteria

- Initial view is `'exterior'` showing the Jacobs' Pharmacy storefront
- Camera framed at street level looking at the building
- StartGate button reads `Enter the Pharmacy`
- Clicking the button: gate fades, view transitions to `'machine'`, camera animates from exterior pose into the machine pose over 1.6s
- Reduced-motion users get an instant cut to the machine pose
- Pharmacy exterior visible only when view === 'exterior' (hidden during machine and chapter views)
- Cycling chapters (1-4 keys, Esc) works normally; can't accidentally go back to exterior
- `npm run build` passes, console clean
- No transmission materials

## Out of scope

- Don't touch the bottle component or Phase A's GLB integration
- Don't touch the existing pharmacy INTERIOR (Round 5's jacobs-pharmacy.tsx)
- Don't touch the existing acts (role/tools/agent/takeaways)
- Don't touch the scene-backdrop / scene-lighting / postprocessing
- Don't add audio
- Don't add a "back to exterior" button (one-way trip)

## Visual reference notes

The Sketchfab "Low Poly New York City Block" model is the visual genre target — clean low-poly stylized buildings with intentional brick/window detail, not photoreal. We're building procedurally in that aesthetic.

Five Points Atlanta in 1886 was a busy commercial intersection with red-brick Victorian commercial buildings. Jacobs' Pharmacy specifically had:
- A corner location at Peachtree and Marietta
- Large plate-glass display windows
- Gold-leaf painted signage on the windows and above the door
- A soda fountain inside visible through the front window

Build that look procedurally.

## Verification

```bash
npm run dev
# Open localhost:5173
# You should see the pharmacy storefront, not the vending machine
# Click "Enter the Pharmacy" → camera dollies forward into the building
# Lands at the existing machine hub view (with Round 5's pharmacy interior around it)
# Press Esc from any chapter → returns to machine view (NOT exterior)
```
