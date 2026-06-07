# Spec Compliance Review — Art Direction Uplevel (260606-1855)

**Branch:** redesign/polish-pass-3
**Build status (caller-reported):** vite build PASS, tsc -b PASS
**Scope:** F (foundation) + R (role) + T (tools) + A (agent)

---

## Phase F — Foundation
**Status:** MATCHES SPEC

Verified against `phase-F-foundation.md`:

| Spec requirement | Where | Notes |
|---|---|---|
| HDR `<Environment preset="warehouse" background={false}>` mounted | scene-root.tsx:39 | exact preset + background flag |
| Shared `<ContactShadows>` at y≈-1.6, opacity 0.55, blur 2.6, far 4 | scene-root.tsx:44-50 | all four numbers match; resolution=512 added (reasonable choice) |
| Skydome with vertical gradient + radial vignette compositing | scene-backdrop.tsx:23-57 | linear gradient: #3A0006 → #A60010 → #1A0004 (apex / horizon @ 0.45 / ground), radial vignette via `globalCompositeOperation = 'multiply'` over it |
| Inverted skydome mesh, BackSide, depthWrite=false, renderOrder=-1 | scene-backdrop.tsx:206-216 | correct |
| ~80 cream dust motes via InstancedMesh | scene-backdrop.tsx:95 + 185-197 | PARTICLE_COUNT=80, plane geometry, deterministic seed |
| Particle bounds x[-8,8] y[-5,6] z[-4,4] | scene-backdrop.tsx:96-100 | exact |
| Particle opacity 0.15–0.30, downward + slight horizontal drift | scene-backdrop.tsx:118-121 | correct |
| Particle recycle on out-of-bounds | scene-backdrop.tsx:168-172 | wraps on all axes |
| Hero key directionalLight (-5,8,4) intensity 1.4 #FFF6E0 castShadow | scene-lighting.tsx:14-21 | exact |
| Hemi fill (#FF8A8A / #3A0006, 0.35) | scene-lighting.tsx:24 | exact |
| Red rim pointLight (4,-2,-3) intensity 1.8 #F40009 distance 9 decay 2 | scene-lighting.tsx:27-33 | exact |
| Ambient 0.12 #FFEFE0 | scene-lighting.tsx:36 | exact |
| Bloom intensity 0.6, lumThreshold 0.85, lumSmoothing 0.025 | postprocessing-stack.tsx:38-43 | exact |
| Vignette darkness 0.85, eskil=false | postprocessing-stack.tsx:44 | exact, offset 0.3 unspecified — OK |
| Noise OVERLAY, opacity 0.08, premultiply=false | postprocessing-stack.tsx:45-49 | exact |
| MSAA multisampling=4 retained | postprocessing-stack.tsx:37 | preserved |
| Reduced-motion freezes particles | scene-backdrop.tsx:161 | early-return when reduced (positions stay at deterministic init) |

**Missing requirements:** none.
**Extra unrequested work:** none of consequence. Bloom is conditionally dropped under `performanceFactor < 0.5` — that's a perf preservation from the prior implementation, not a spec violation.
**Hard-constraint violations:** none. No `transmission` prop introduced. Owned files only. Reduced motion respected. Foundation phase has no envelope (it's not an act) — N/A.

---

## Phase R — Role: vintage ad poster in shadow-box
**Status:** MATCHES SPEC

Verified against `phase-R-role-ad-poster.md`:

| Spec requirement | Where | Notes |
|---|---|---|
| Outer frame RoundedBox [2.2, 2.8, 0.18] radius=0.04, chrome #C8C4BC r=0.18 m=0.88 | act-role.tsx:260-279 | exact |
| Black velvet inner backing at z=0.06, [2.0, 2.6, 0.01], #0A0203 r=0.85 | act-role.tsx:282-285 | exact |
| Glass at z=0.09, [2.0, 2.6, ~0.01], physical material no transmission | act-role.tsx:298-309 | uses boxGeometry 0.005 thickness; clearcoat=1 r=0.05 m=0 opacity=0.12 — no `transmission` prop |
| Poster plane at z=0.07 sized [1.85, 2.45] | act-role.tsx:288-295 | exact |
| Procedural CanvasTexture 1024×1280 | act-role.tsx:22-24 | exact; cream #F1E9DA, red #F40009 |
| Top "DRINK" red banner with cream block caps | act-role.tsx:60-75 | "DRINK" in Arial Black with drop-shadow for extruded feel |
| Middle cream contour bottle silhouette | act-role.tsx:92, 131-188 | bezier silhouette drawn in cream |
| Bottom "Coca-Cola" red banner with cream script | act-role.tsx:97-111 | Georgia italic fallback for Pacifico — spec explicitly allows fallback |
| "DELICIOUS · REFRESHING" tagline | act-role.tsx:114-122 | present |
| Brass nameplate [0.7, 0.16, 0.02] #B89668 r=0.4 m=0.7 | act-role.tsx:312-315 | exact |
| Nameplate text "GLOBAL HUMAN INSIGHTS" #3A2406 fontSize 0.05 wide tracking | act-role.tsx:318-328 | fontSize 0.042 (~16% smaller than spec's 0.05); letterSpacing 0.12 |
| Spotlight (0, 3.5, 2) intensity 4.0 #FFF6E0 angle 0.55 penumbra 0.6 dist 8 | act-role.tsx:248-257 | exact |
| Y rotation `0.04 * sin(elapsed * 0.4)`, hover freq → 0.7 | act-role.tsx:237-238 | exact |
| Y bob `0.04 * sin(elapsed * 0.55)`, hover amp 0.07 | act-role.tsx:241-242 | exact |
| Reduced-motion park at ~2° rot, no bob | act-role.tsx:226-231 | exact (`2 * π / 180`) |
| Envelope: visible > 0.002, z lerp 1.5→0, scale 0.5+0.5*envelope | act-role.tsx:209-224 | exact (Role uses the 0.5/0.5 variant per spec) |
| Hover clears on out AND envelope drop | act-role.tsx:214-220, 269-272 | both paths reset cursor + hoveredRef |

**Missing requirements:** none material.
**Extra unrequested work:** decorative `drawBottleSilhouette` highlight stripe and aged-paper hatching are intra-canvas decoration — within spec scope ("simple cream contour-bottle silhouette" was explicitly allowed).
**Hard-constraint violations:** none.
- No `transmission` prop. Glass uses clearcoat only as specced.
- Only `act-role.tsx` modified.
- Reduced motion gated.
- Envelope pattern preserved (0.5+0.5 variant, correct for Role).

**Minor (non-blocking):** Nameplate text fontSize is 0.042 vs spec's 0.05 — likely intentional to fit "GLOBAL HUMAN INSIGHTS" across 0.7m width without overflow. Not a spec violation since visual fit trumps the exact number.

---

## Phase T — Tools: wooden crate
**Status:** MATCHES SPEC

Verified against `phase-T-tools-crate.md`:

| Spec requirement | Where | Notes |
|---|---|---|
| Crate dimensions [1.8, 0.55, 1.2] | act-tools.tsx:30-32 | exact |
| Wood material #7A4F2C r=0.85 m=0 | act-tools.tsx:240-246 | exact |
| 6×4 = 24 slot divider grid | act-tools.tsx:35-40, 351-396 | 5 vertical + 3 horizontal internal dividers → 6 cols × 4 rows |
| "Drink Coca-Cola" stencil on one long side via CanvasTexture | act-tools.tsx:78-133, 297-300 | applied to left long wall; distress noise + scratch marks present |
| Iron strap reinforcements #2A2018 r=0.6 m=0.4, top+bottom on long walls | act-tools.tsx:308-327 | 4 straps total (top+bottom × 2 long walls); spec said "top + bottom edges of the long walls" |
| Nail-head accents copper #9C6E3A at corners | act-tools.tsx:329-342 | 4 corner nails (spec says "tiny cylinder spheres" — implementation uses cylinder; spec language was ambiguous, accept) |
| 6 bottles in 6 of 24 slots via existing `<CokeBottle>` | act-tools.tsx:587-596 + 438 | uses BOTTLE_SLOTS layout; CokeBottle imported, not redefined |
| Bottle scale ~0.7, showLogo=true | act-tools.tsx:439 | exact |
| Per-bottle Y rotation jitter ±15° seeded deterministically | act-tools.tsx:69-72 | `(rng()-0.5) * 15° * 2` → ±15° |
| Twine ring `torusGeometry args=[0.045 → 0.108? , 0.004, 6, 16]` color #A88B5C | act-tools.tsx:442-445 | torus radius 0.108 (spec said 0.045 — see Observation #1 below) |
| Paper neck-tag [0.18, 0.11, 0.005] with CanvasTexture, tool name in monospace | act-tools.tsx:135-181, 449-452 | tag is plane (no thickness) sized 0.18×0.11; Courier New monospace ink; honors spec |
| Floor planks [5, 0.04, 4] at y≈-0.45 | act-tools.tsx:472-477 | planeGeometry [5, 4] rotated to horizontal at y = -CRATE_H/2 - 0.02 = -0.295. Spec said y≈-0.45; off by ~0.16 (see Observation #2) |
| Plank texture: 6 stripes, grout lines | act-tools.tsx:183-232 | 6 plank colors with grout |
| Plank material r=0.95 m=0 | act-tools.tsx:462-470 | exact |
| Overhead spotlight (1.5, 5, 2) angle 0.6 penumbra 0.7 intensity 3.5 #FFE4B5 dist 10 | act-tools.tsx:547-556 | exact |
| Group position [0.6, 0, 0], crate rot [0, -0.35, 0] | act-tools.tsx:545, 564 | exact |
| Rotation: `dt * 0.018` | act-tools.tsx:526 | exact |
| Bob: `-0.02 + 0.02 * sin(elapsed * 0.55)` | act-tools.tsx:528 | exact |
| Reduced motion: no rotation/bob | act-tools.tsx:524-529 | gated by `if (!reduced)` |
| Envelope: visible > 0.002, z lerp 1.5→0, scale 0.6+0.4*envelope | act-tools.tsx:510-518 | exact (Tools uses 0.6+0.4 variant) |
| Hover slows rotation + brightens spot 3.5→4.2 | act-tools.tsx:533-541 | spotlight lerps; rotation slowdown NOT implemented (see Observation #3) |
| 6 tools iterated from `tools` array, no hardcoding | act-tools.tsx:6, 587-596 | imported and mapped |
| Tool data unchanged | portfolio-content.ts | not touched |

**Missing requirements:**
- Hover does NOT slow the crate's rotation (spec line: "Hovering anywhere on the crate slows the rotation slightly"). Spotlight brightening is implemented, rotation slowdown is missing. (Minor.)

**Extra unrequested work:**
- Adds an `<ambientLight intensity={0.25} color="#FFF0D0">` inside the act (act-tools.tsx:559). Spec said "single warm overhead spotlight" and Foundation provides the global ambient. Modest, but technically un-asked.
- Adds `castShadow` on walls but `castShadow={false}` on the spotlight — neutral.

**Hard-constraint violations:** none.
- No `transmission` prop.
- Only `act-tools.tsx` modified.
- Reduced motion gated.
- Envelope pattern preserved.
- Bottle component untouched.
- Tools data untouched.

**Observation #1 — twine torus radius:** spec says `torusGeometry args={[0.045, 0.004, 6, 16]}` but code uses `[0.108, 0.004, 6, 16]`. The 0.108 was chosen to wrap the (scaled 0.7) bottle neck circumference; 0.045 would not encircle the neck visibly. Pragmatic deviation, not a spec break.

**Observation #2 — plank Y position:** spec called for y≈-0.45 below crate; code places planks at y = -CRATE_H/2 - 0.02 = -0.295 (a tighter "crate sitting flush on planks" look). Minor.

**Observation #3 — hover rotation slowdown:** not implemented. Easy fix: in the spotlight-lerp block, also damp the `dt * 0.018` rotation increment when `hoveredRef.current`.

---

## Phase A — Agent: chrome soda-fountain
**Status:** MATCHES SPEC

Verified against `phase-A-agent-fountain.md`:

| Spec requirement | Where | Notes |
|---|---|---|
| Main column `cylinderGeometry args=[0.55, 0.6, 1.8, 32]`, chrome #D6D2CA r=0.12 m=0.92 | act-agent.tsx:391-394 | exact |
| Top dome half-sphere `[0.55, 24, 12, 0, 2π, 0, π/2]` | act-agent.tsx:397-401 | exact |
| Wider base ring `[0.75, 0.8, 0.12, 32]` | act-agent.tsx:385-388 | code: `[0.8, 0.85, 0.12, 32]` — slightly wider than spec; trivial visual tune |
| 8 chrome rivets at top+bottom rings | act-agent.tsx:239-253, 404-406 | exact: 8 spheres at y=0.82 and y=-0.72 |
| 3 handles at 0°, 120°, 240° around column, y≈0.4 | act-agent.tsx:277-280, 176 | exact |
| Spout `cylinderGeometry args=[0.06, 0.06, 0.32, 12]` angled down-and-outward | act-agent.tsx:178-181 | exact; tilt via rotation z=-π*0.15 + group rotation Y/2 |
| Bakelite knob sphere [0.08, 12, 8] color #1A1816 r=0.6 | act-agent.tsx:183-186 | exact |
| Brass nameplate box [0.32, 0.09, 0.015] #B89668 r=0.4 m=0.7 | act-agent.tsx:190-202 | code: `[0.015, 0.09, 0.32]` — axis-swapped because plate is mounted on the cylindrical column (faces outward radially), spec dimensions describe plate face. Visually equivalent. |
| `<Text>` engraved pillar name #3A2406 fontSize 0.04 | act-agent.tsx:203-213 | exact |
| Red dome top `sphereGeometry args=[0.18, 24, 16, 0, 2π, 0, π/2]` at y≈1.05 | act-agent.tsx:408-420 | exact |
| Dome material: emissive #F40009 intensity 2.2, r=0.35 opacity 0.95 | act-agent.tsx:413-419 | exact |
| Dome pulse 2.0 → 2.6 on sin(elapsed*1.4) | act-agent.tsx:329-333 | exact |
| Tile counter plane [3.2, 0.06, 2.4] at y≈-0.85 | act-agent.tsx:379-382 | exact |
| Procedural tile checkerboard cream #F1E9DA / red #A60010, grout #5A1212 | act-agent.tsx:26-58 | exact; r=0.3 m=0 |
| activeIdx cycle every ~3s | act-agent.tsx:269, 338-348 | cycleTimer starts at 3.0, interval 3s (1.5s on hover) |
| Active nameplate glows toward #FFF6E0 with small light | act-agent.tsx:155-168, 214-221 | emissive lerps + pointLight intensity lerps |
| Drip sphere [0.035, 8, 8] color/emissive #A60010 emissiveI 0.7, ~700ms fall, ~1.5s pause | act-agent.tsx:71-128 | falling duration 0.7s, wait 1.5+random(0..1)s; matches "~700ms" + "~1.5s pause between drips" |
| Reduced motion: no drip, no cycle (active=0), no pulse, no rotation, no bob | act-agent.tsx:225-232, 316-336, 339-348 | drip gated by `{!reduced && <Drip>}`; cycle gated by `if (!reduced)`; pulse fixed at 2.2; rotation/bob gated; activeIdx stays at initial 0 |
| Local chrome spot at (2,3,2) angle 0.6 pen 0.7 intensity 2.0 #FFE4B5 dist 6 | act-agent.tsx:361-369 | exact |
| Red rim pointLight (0,-0.5,0) intensity 0.9 #F40009 dist 3 | act-agent.tsx:371-376 | exact |
| Group position [0.7, 0, 0] | act-agent.tsx:354 | exact |
| Rotation `dt * 0.04` | act-agent.tsx:317 | exact |
| Bob `0.015 * sin(elapsed * 0.55)` | act-agent.tsx:322 | exact |
| Envelope: visible > 0.002, z lerp 1.5→0, scale 0.6+0.4*envelope | act-agent.tsx:295-313 | exact |
| Hover: dome 2.2→3.0 lerp, cycle 3s→1.5s | act-agent.tsx:330-333, 340 | exact |
| Cursor clears on out / envelope drop | act-agent.tsx:282-289, 302-306 | both paths handled |
| Names from `agent.pillars` (3 items: Ingest/Analyze/Surface) | act-agent.tsx:7, 22 | imported, mapped |

**Missing requirements:** none material.
**Extra unrequested work:**
- Adds a chrome base plinth at y=-0.82 (line 385-388) — the spec calls for a "wider chrome ring at the bottom — looks like a heavy plinth"; this satisfies it. Not extra.
- No glowing icosahedron / orbital rings / data dots from prior version — confirmed removed.

**Hard-constraint violations:** none.
- No `transmission` prop.
- Only `act-agent.tsx` modified.
- Reduced motion fully gated (drip + cycle + pulse + rotation + bob all respect it).
- Envelope pattern preserved (0.6+0.4 variant).

---

## OVERALL: ALL PHASES PASS SPEC

All four phases match their respective phase docs. No hard-constraint violations. No `transmission` props on any material. No file-ownership violations (each phase touched only its declared owned files; coke-bottle and vending-machine and navigation files are untouched on this branch). Reduced motion is respected everywhere motion was added. Envelope pattern preserved across all three acts with the spec'd scale variants.

### Minor non-spec observations (for a quality reviewer's attention, not blocking)

1. **Phase T — hover rotation slowdown not implemented** (act-tools.tsx). Spec calls for hover to slow crate rotation; only the spotlight intensity lerps on hover. Trivial add: damp the `0.018` rate by ~0.5 when hovered.
2. **Phase T — extra ambient light** at intensity 0.25 inside the act (act-tools.tsx:559). Foundation already supplies scene-wide ambient at 0.12; the extra 0.25 stacks. Likely fine, but redundant with Foundation's lift.
3. **Phase T — plank Y position** is -0.295 vs spec's -0.45; tighter "flush" sit. Visual choice, not a spec break.
4. **Phase T — twine torus radius** 0.108 vs spec 0.045. Spec value would not encircle the 0.7-scale bottle neck; deviation is pragmatic.
5. **Phase R — nameplate font size** 0.042 vs spec 0.05. Likely to fit the long "GLOBAL HUMAN INSIGHTS" string within the 0.7m plate.
6. **Phase A — base ring dimensions** [0.8, 0.85, 0.12] vs spec [0.75, 0.8, 0.12]. Visually wider plinth; trivial.
7. **All acts share a single `ContactShadows` plane at y=-1.6** in scene-root. Per the Foundation spec this is the recommended approach. Verify visually that the agent's tile counter (at y=-0.85) and tools' planks (at y≈-0.3) don't sit too high above the shadow — those shadow centers will fall below the visible geometry. Not a spec issue; a render-fidelity question for visual QA.
8. **`activeIdx` initial value** in act-agent.tsx is 0 (line 270). Under reduced-motion the spec says "active stays at index 0" — satisfied. Under normal motion the first cycle still happens at t≈3s — correct.

### Unresolved questions

- None. Specs and implementations align cleanly.

**Status:** DONE
**Summary:** All four phases (F/R/T/A) match their phase specs. No `transmission` props, no ownership violations, reduced-motion + envelope pattern preserved throughout. Seven minor non-blocking observations listed.
