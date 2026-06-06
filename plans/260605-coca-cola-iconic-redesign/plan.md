# Coke-Recap — "RECAP: A Coca-Cola Story" iconic redesign

**Branch:** `redesign/coca-cola-iconic`
**Baseline checkpoint commit:** `ef5fd56`

## Why

User feedback on the current build: *"still very laggy, and I didn't like the overall
demonstration — it could be much cooler, much more Coca-Cola like, include logos and stuff."*

Two root problems:

1. **Performance.** Transmission materials (`meshPhysicalMaterial` with `transmission`) are
   still used in Act 1 (1 sphere), Act 2 (**6 cubes**), and Act 4 (1 bottle). Each transmissive
   object forces THREE's transmission render pass — the #1 remaining lag source. The
   postprocessing chain also runs 4 fullscreen effects (Bloom + ChromaticAberration + Vignette
   + Noise).
2. **Brand identity.** The scene reads as generic sci-fi (glowing icosahedrons, abstract rings,
   particle spirals). Nothing says "Coca-Cola."

## Creative direction

Turn the site into a **branded title-sequence** set inside Coca-Cola's real visual world.

**Signature moves:**
- Flip the environment from near-black (`#0A0203`) to a rich **Coca-Cola red** world (radial
  gradient, bright red core → deep crimson edges).
- Recurring **brand iconography**: the script wordmark, the **dynamic ribbon** (white wave),
  the **contour bottle**, the **crimped bottle cap**, and **carbonation bubbles**.
- **Performance-first**: remove ALL transmission materials, trim postprocessing to Bloom +
  Vignette (+ SMAA), cap DPR at 1.5, keep instancing/points.

**Brand object escalation across acts:**
Act 0 ribbon + wordmark → Act 1 bottle cap → Act 2 tool "can labels" → Act 3 brand core →
Act 4 contour bottle finale.

## Brand tokens (already in `src/styles/tokens.css` + `tailwind.config.js`)
- Coca-Cola Red `#F40009`
- Cream `#F1E9DA`, Off-white `#FFFEF6`, Caramel `#A06A00`
- New: deep crimson `#5A0A0E` and dark `#2A0406` for the red gradient world.
- New font: **Pacifico** (`@fontsource/pacifico`) — open-source script, evokes the Coca-Cola
  wordmark. Used ONLY for the brand wordmark, never body copy.

## Architecture invariants (do not break)
- Single persistent `<Canvas>` in `scene-root.tsx`; acts never unmount.
- One source of scroll truth: `useScrollRef()` (a `RefObject<number>`). Acts read it inside
  `useFrame` — never via React state.
- **Camera motion lives ONLY in `camera-rig.tsx`.** Acts must never move/lookAt the camera.
- Act visibility/fade via `getActWindow()` + `actEnvelope()` from `use-act-window.ts`. Keep
  `ACT_WINDOWS` ids: cold-open, role, tools, agent, bottle.
- Honor `useReducedMotion()` in every animated component (snap/disable motion when reduced).
- R3F v9 + React 19 ref gotcha: `useRef<T>(null)` → `RefObject<T | null>`; prop types passing
  refs MUST declare `RefObject<T | null>`.
- `vite-env.d.ts` keeps `import '@react-three/fiber';` side-effect import.

## Tasks (execute in order)

### Task 1 — Brand world + performance foundation
Files: `src/scene/scene-root.tsx`, `src/scene/postprocessing-stack.tsx`,
`src/scene/scene-lighting.tsx`, `src/styles/globals.css`, `src/styles/tokens.css`,
`tailwind.config.js`, `package.json` (add `@fontsource/pacifico`),
`src/scene/fluid-environment.tsx`, `src/scene/bubbles.tsx`.
- Canvas → `gl={{ alpha: true, ... }}`, remove the opaque `<color attach="background">`.
- Page background: CSS radial gradient (bright Coca-Cola red center → deep crimson → dark) on
  `body`/root behind the fixed canvas. Cheap, instant brand read.
- Postprocessing: keep **Bloom** (intensity ~1.1, `luminanceThreshold` ~0.65 so the red bg does
  NOT bloom into mush) + **Vignette**; ADD **SMAA**; REMOVE ChromaticAberration + Noise.
  Keep the `performanceFactor < 0.5` → disable Bloom path.
- DPR cap `[1, 1.5]`.
- Lighting: warm brand key + cool rim tuned for the red world (white/cream highlights so brand
  objects pop against red).
- Bubbles: keep the points field; retune color to bright white/cream and density for the red bg.
- `fluid-environment.tsx` stays the cheap bubbles-only wrapper (no fullscreen fbm).
- Delete now-unused `src/shaders/liquid.frag.glsl` + `src/shaders/liquid.vert.glsl` IF nothing
  imports them (verify first).

### Task 2 — Shared brand components (ribbon + wordmark + favicon)
New files: `src/scene/brand/dynamic-ribbon.tsx`, `src/ui/brand/wordmark.tsx`,
`public/favicon.svg` (overwrite).
- `DynamicRibbon`: a flowing white "wave" ribbon (the Coca-Cola dynamic ribbon). Implement
  cheaply — a `TubeGeometry`/curved ribbon along a sine/bezier curve, double-sided, glossy
  white w/ subtle emissive so Bloom catches it. Props: scale, color, speed, a gentle undulation
  animation, honor reduced motion. Reusable by acts 0/3.
- `Wordmark`: DOM component rendering "Coca-Cola" in **Pacifico**, white, with drop shadow and a
  small ® — the logo lockup. Props for size/className. Used in cold-open hero + bottle finale.
- `favicon.svg`: red disc ("button") with a white wave/"C".

### Task 3 — Act 0 Cold Open rebrand
File: `src/scene/acts/act-cold-open.tsx` + `src/ui/sections/cold-open-section.tsx`.
- REMOVE the red icosahedron + 4 orbiting satellites.
- NEW 3D: a `DynamicRibbon` sweeping across center + extra rising bubbles concentration.
- Overlay: the `Wordmark` ("Coca-Cola") as the dominant hero element above the name/role; keep
  scroll cue. Ensure contrast on the red world.

### Task 4 — Act 1 Role → bottle cap
File: `src/scene/acts/act-role.tsx`.
- REMOVE transmission sphere + 8 tube streams + 12 particles.
- NEW: an iconic **crimped Coca-Cola bottle cap** — red top disc (clearcoat, NO transmission) +
  metallic crimped rim (cheap: instanced small boxes around the rim, or a fluted cylinder).
  Slow rotation, gentle tilt. Optional small wordmark/label on the cap top via drei `<Text>`.
- Keep envelope fade-in/out + reduced motion.

### Task 5 — Act 2 Tools → "can label" chips ring
File: `src/scene/acts/act-tools.tsx`.
- REMOVE the 6 transmission cubes (and their halo planes if not needed).
- NEW: 6 glossy **red rounded panels** ("can label" chips) on a ring (reuse `tools` data),
  `meshStandardMaterial` (NO transmission), each with its tool name via drei `<Text>`. Scroll
  drives a highlight that scales + brightens the active chip (keep existing highlight logic).
- Keep ring rotation + envelope + reduced motion.

### Task 6 — Act 3 Agent → brand core (trimmed)
File: `src/scene/acts/act-agent.tsx`.
- Keep the gaussian "ignite" feel but TRIM for perf: rings 5 → 2–3, data dots 30 → ~16,
  nebula icosa detail 3 → 2.
- Make it brand-flavored: red glowing core + a `DynamicRibbon` orbiting + cream data dots
  converging. Keep `Ingest/Analyze/Surface` labels (Billboard `<Text>`).
- Keep envelope + reduced motion.

### Task 7 — Act 4 Bottle → recognizable contour bottle finale
File: `src/scene/acts/act-bottle.tsx` + `src/ui/sections/learnings-section.tsx`.
- Refine the lathe profile toward the classic contour ("hobble-skirt") silhouette.
- REPLACE transmission material with a cheap glass-look: deep-red `meshPhysicalMaterial` with
  `clearcoat` (NO `transmission`), low roughness, internal point light + Bloom for the liquid
  glow. Optional thin **label band** cylinder with white script.
- Keep scale-up reveal + slow rotation + reduced motion.
- Finale overlay (`learnings-section`): add the `Wordmark` + a closing tagline above the
  takeaways/contact.

### Task 8 — Typography + contrast pass + final perf verification
Files: section components as needed, `globals.css`.
- Audit all overlay text for contrast against the red world (bump low-opacity creams; add
  shadow/scrim where needed). Keep Playfair for editorial, Pacifico only for the wordmark.
- `npm run build` must pass clean (tsc + vite). Walk the dev build mentally for transmission
  passes = 0. Then commit.

## Done criteria
- Zero transmission materials in the scene (grep `transmission` → only comments).
- Red Coca-Cola world + wordmark + ribbon + cap + contour bottle all present.
- `npm run build` passes; bundle not materially larger.
- Reduced-motion still fully supported.
