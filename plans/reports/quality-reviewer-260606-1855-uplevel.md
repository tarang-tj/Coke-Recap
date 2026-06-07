# Code Quality Review — Art-Direction Uplevel

**Branch:** redesign/polish-pass-3
**Spec compliance:** already passed (`spec-reviewer-260606-1855-uplevel.md`)
**Scope:** scene-root, scene-backdrop, scene-lighting, postprocessing-stack, act-role, act-tools, act-agent
**Focus:** R3F discipline, perf risk, leaks, dead code, React idiomatic correctness

---

### src/scene/scene-root.tsx (61 lines)

**Strengths:** Clean, small. PerformanceMonitor → state → PostprocessingStack wiring is correct (lifts perfFactor exactly once on factor change, no per-frame setState). DPR cap, AdaptiveDpr, alpha+CSS-gradient strategy all sound.

**Issues (must-fix):** None.

**Issues (should-fix):**
- `ContactShadows` at `position={[0, -1.6, 0]}` (line 45) sits **below** every act's floor surface. Per-act floor heights:
  - Tools wood-plank floor: `y = -CRATE_H/2 - 0.02 = -0.295`
  - Agent tile counter top: `y = -0.85` (+ 0.03 half-thickness above)
  - Role frame: no floor; centerpiece centered at y≈0
  Result: the contact-shadow plane is 1.3–1.6 units below the visible floor in Tools/Agent. Shadows render onto an unseen plane and appear absent under the object — objects look "floaty." Fix: either (a) move ContactShadows up to per-act floor height by wrapping it in each act (cleanest), or (b) drop the shared ContactShadows entirely and add per-act ContactShadows scoped to the act group at the correct y. Recommend (b) — the three acts have very different ground planes, a single shared shadow plane cannot serve all three.

**Issues (nit):** None.

---

### src/scene/scene-backdrop.tsx (222 lines)

**Strengths:** Exemplary frame-loop discipline — `_mat/_pos/_quat/_scale` scratch objects hoisted via `useMemo`, no per-frame allocation in `useFrame`. CanvasTextures created once via `useMemo`, both `dustTex` (line 182) and `texture` (line 202) disposed on unmount via `useEffect` cleanup. `frustumCulled={false}` (line 207) is correct for the radius-45 skydome. Deterministic seeded RNG ensures stable hydration. `dt` clamped to 0.05 (line 163) prevents tab-switch jumps.

**Issues (must-fix):** None.

**Issues (should-fix):**
- The dust mesh's `<planeGeometry>` and `<meshBasicMaterial>` are JSX-mounted children of `<instancedMesh>` so R3F will auto-dispose them — good. But `dustTex` is passed as the `map`; on unmount the *texture* is disposed by the explicit cleanup AND the material's dispose() will also try to release it. That's a no-op double-dispose, safe but a smell. Acceptable as written.

**Issues (nit):**
- `args={[undefined, undefined, PARTICLE_COUNT]}` (line 185): works because JSX children attach geometry/material, but reads odd. Idiomatic in R3F for instanced meshes that bind via children, so leave.

---

### src/scene/scene-lighting.tsx (39 lines)

**Strengths:** Clean 3-light hero setup — directional key + hemisphere fill + brand-red rim point + low ambient lift. Matches the Foundation phase spec. Single shadow caster (the directional). Shadow map 1024² — reasonable.

**Issues (must-fix):** None.

**Issues (should-fix):** None.

**Issues (nit):**
- Hemisphere uses `args={['#FF8A8A', '#3A0006', 0.35]}` — readable and concise.

---

### src/scene/postprocessing-stack.tsx (52 lines)

**Strengths:** Tight, well-tuned. `multisampling={4}` correctly chosen over SMAA (bundle weight). Low-end branch drops Bloom but keeps cheap passes. `mipmapBlur` on Bloom is the modern, faster path.

**Issues (must-fix):** None.

**Issues (should-fix):**
- The two `<EffectComposer>` branches duplicate `Vignette` + `Noise` JSX. When `performanceFactor` crosses 0.5 the entire composer remounts (different JSX tree, no shared key), re-allocating render targets. Not a hot path (factor changes are rare) but cleaner to render a single `<EffectComposer>` with `{bloomEnabled && <Bloom ... />}` inside. Saves render-target churn on the boundary crossing.

**Issues (nit):** None.

---

### src/scene/acts/act-role.tsx (331 lines)

**Strengths:** Reference example of the codebase's mutable-ref pattern — `hoveredRef` for hot-loop bridging, no setState in `useFrame`. Poster texture baked in `useMemo`, disposed on unmount (line 203). Cursor cleanup handled in the frame loop's inactive branch (lines 215–219) so navigating away while hovered correctly clears cursor. `frustumCulled` left at default — correct, geometry is small and local.

**Issues (must-fix):** None.

**Issues (should-fix):**
- Glass cover (line 298) uses `<meshPhysicalMaterial>` with `clearcoat={1}` and `transparent={true}, opacity={0.12}` — correct for the no-transmission rule. Verify transparency sort order is stable across the velvet/poster/glass stack (velvet z=0.06, poster z=0.07, glass z=0.09) — z-distances large enough, should be fine, but worth a visual check.

**Issues (nit):**
- Line 325: `font={undefined}` on `<Text>` — drei accepts the prop as optional; the explicit `undefined` is harmless dead syntax. Drop the prop.
- Line 120 (in poster texture builder): `ctx.letterSpacing` is not a standard Canvas2D property — TS will accept it as a string assignment but the browser ignores it. Comment acknowledges this. Cosmetic, no impact.

---

### src/scene/acts/act-tools.tsx (600 lines)

**Strengths:** Material discipline — `woodMat/stencilMat/ironMat/nailMat/divMat/twineMat/tagMat` all hoisted into `useMemo`, geometry instances are JSX (R3F auto-disposes). Deterministic per-bottle rotation jitter via seeded RNG. `dt`-based rotation (line 526) correctly frame-rate-independent.

**Issues (must-fix):**
1. **Texture leak.** `stencilTex` (line 497), `plankTex` (line 498), and `tagTextures` (line 499–502) are created via `buildCrateStencilTexture()` / `buildPlankTexture()` / `buildNeckTagTexture()` — these are manually-allocated `THREE.CanvasTexture` instances NOT mounted as JSX children, so R3F won't auto-dispose them. There is no `useEffect(() => () => tex.dispose(), [...])` for any of them. On every Tools-act remount these leak GPU memory. **Compare to act-role.tsx line 203 where the same pattern IS handled.** Add cleanup hooks.

2. **Cursor leak.** Lines 565–575: `onPointerOver` sets `document.body.style.cursor = 'pointer'`. Unlike act-role/act-agent, there is **no fallback cleanup** in the frame loop when the act becomes inactive (`envelope <= 0.002`). If the user is hovering the crate when they navigate to another act, the cursor stays "pointer" indefinitely. The early-return at line 514 (`if (!active) return;`) bypasses any cleanup. Mirror the pattern from act-role.tsx lines 215–219.

**Issues (should-fix):**
- **Dead state.** Line 493: `const [_hovered, setHovered] = useState(false)`. `_hovered` is genuinely unused — the spotlight intensity is driven by `hoveredRef.current` in the frame loop (line 534). Every hover transition still triggers a re-render of the entire `ActTools` subtree (6 BottleInCrate + crate walls + dividers) for no benefit. Remove the state; rely on the ref only. The comment "drives spotlight in frame loop" is incorrect — the ref does that work.
- Line 499–502: `useMemo(() => tools.map((t) => buildNeckTagTexture(t.name)), [])` — missing `tools` in dep array. Module-level import so effectively constant, but exhaustive-deps lint will flag.
- `twineMat` (line 426) is identical across all 6 `BottleInCrate` instances. Hoist to a parent-shared `useMemo` (or module-level outside React if you want to skip the hook). Same for `tagMat` — actually that one differs per bottle because `tagTex` differs, so keep it per-instance.

**Issues (nit):**
- Pointer events on `crateGroupRef` (line 562) — this group continuously rotates at 0.018 rad/s. Raycaster will follow it fine, but the hit volume changes shape over time; transient flickering on edges is possible. Acceptable.
- File at 600 lines — at the 500-line guideline ceiling. CrateWalls + CrateDividers + BottleInCrate + WoodPlanks could split into `act-tools-crate.tsx` if it grows more.

---

### src/scene/acts/act-agent.tsx (434 lines)

**Strengths:** Three pull-handle subcomponents nicely encapsulated. `RivetRing` is a clean reusable. Direct material mutation in `useFrame` (`mat.emissiveIntensity += ...`, lines 158, 166, 333) is the correct R3F pattern — no React reconciliation pressure.

**Issues (must-fix):**
1. **Per-frame allocation in `useFrame`.** Line 161 inside `HandleAssembly`'s frame callback:
   ```ts
   const c = new THREE.Color(targetColor);
   mat.emissive.lerp(c, Math.min(1, dt * 4));
   ```
   This runs **per frame, per handle** (3 handles × 60 fps = 180 `THREE.Color` allocations/sec). Classic GC-pressure pattern. Fix: hoist a scratch color into `useMemo` and call `c.set(targetColor)` each frame, OR pre-compute the two `THREE.Color` instances (`brassActiveColor`, `brassBaseColor`) at module/component scope and use the appropriate one.

2. **Texture leak.** Line 274: `const tileTexture = useMemo(() => buildTileTexture(), [])` — manually allocated CanvasTexture, never disposed. Same fix as act-tools: `useEffect(() => () => tileTexture.dispose(), [tileTexture])`.

**Issues (should-fix):**
- **`setState` in `useFrame`** (line 345). The cycle timer fires every 1.5–3s, so frequency is low — but the pattern still triggers a re-render of `ActAgent` subtree including all three `HandleAssembly`s every cycle. The re-render IS needed (to pass new `isActive` to children), so this is *intentional* and *throttled*. However, you could avoid it entirely by passing an `activeIdxRef` down and having each `HandleAssembly` read it inside its own `useFrame` to set its own `isActive`. Lower-priority — current code is correct and rare enough to be acceptable.
- **Per-act ambient/colored lights.** Per the brief: scene-lighting already includes a brand-red rim point (`#F40009`, intensity 1.8). act-agent.tsx:371 adds **another** red `pointLight` at `(0, -0.5, 0)` with `color={COKE_RED}`, intensity 0.9, distance 3 — local underglow for the dome. Two competing red point lights when Agent is active. The local one is short-range (distance 3) so impact is contained, but it does double-bright the lower dispenser area. Suggest: if the brand-rim from scene-lighting already provides red wash, consider lowering this to 0.5 or removing.
- **Redundant ambient in Tools.** (Cross-file note re: act-tools.tsx:559 — `<ambientLight intensity={0.25} color="#FFF0D0" />`.) Scene already has `ambientLight intensity={0.12}`. Tools effectively raises floor to 0.37 while active, washing the shadow contrast. Recommend removing the act-tools ambient or reducing to 0.1.
- Line 22: `const PILLAR_NAMES = agent.pillars.map((p) => p.name)` evaluated at module load, OK for static content but creates a top-level side effect dependent on data import order. Trivially fine here since `agent` is a const export.

**Issues (nit):**
- Line 210: `font={undefined}` — same nit as act-role; drop the prop.
- Line 79 magic numbers `1.5 + Math.random()` and line 109 `1.5 + Math.random() * 1.0` — drip retry interval. Hardcoded but commented intent is clear.
- Line 107: hardcoded `s.y < -0.82` threshold tied to counter at -0.85. Acceptable; consider a constant.

---

## OVERALL: ⚠️ APPROVED-WITH-FIXES

**Must-fix count: 4**

1. **act-agent.tsx:161** — `new THREE.Color()` per frame per handle inside `useFrame`. GC pressure. Hoist scratch color.
2. **act-tools.tsx:497–502 + act-agent.tsx:274** — Four CanvasTexture allocations with no disposal. Real GPU memory leak across act remounts.
3. **act-tools.tsx:565–575** — Cursor leak on act-deactivation while hovered. Mirror cleanup from act-role.tsx:215–219.
4. **scene-root.tsx:45** — Shared ContactShadows at y=-1.6 misses every act's actual floor surface. Move into per-act groups OR remove and add per-act shadow planes.

**Top recommendations (highest leverage):**

1. **Eliminate the four texture leaks** — small change, mirrors a pattern already used correctly in act-role and scene-backdrop. Add four lines of `useEffect` cleanup. Prevents memory creep across navigation.
2. **Fix the contact-shadow ground-plane mismatch** — single biggest visual quality gap. Right now the dispenser and crate visually float because there's no shadow under them on the visible floor. Per-act ContactShadows scoped to the act group at the act-specific floor height is the cleanest solution.
3. **Hoist the per-frame `THREE.Color` allocation** in act-agent.tsx HandleAssembly. Replace `new THREE.Color(targetColor)` with two memoized `THREE.Color` constants (active/inactive) and pick one each frame — zero allocation.

---

## Other observations (informational)

- **No transmission materials anywhere.** Verified. ✅
- **No setState in useFrame except one throttled case** (act-agent cycle, ~once per 1.5–3s — acceptable). ✅
- **Hooks order stable** across all files. ✅
- **frustumCulled={false}** used only on skydome, correctly. ✅
- **Particle count 80**, sphere skydome 32×32, cylinders 32-radial, rivet spheres 6-segment — all within budget. ✅
- **No leftover dead imports** from previous revisions (no nebula, ChipCard, or stale DynamicRibbon imports in any scoped file). ✅
- **File sizes:** scene-root 61, scene-backdrop 222, scene-lighting 39, postprocessing-stack 52, act-role 331, act-tools 600 (at ceiling), act-agent 434. Only act-tools is near the split threshold — flag for the next change.
- **act-tools `_hovered` state is dead** — removing it cuts re-render churn on hover transitions.

---

## Unresolved questions

1. Should per-act ContactShadows live inside each act group (preferred) or should the scene-root ContactShadows be removed entirely in favor of per-act shadows added in each act file? (Affects which file owns the fix.)
2. Is the throttled `setActiveIdx` in act-agent's useFrame considered acceptable per project convention, or should the active-handle state be lifted into a ref + per-handle internal frame check? (Current code works correctly; the question is stylistic.)
3. The per-act supplemental lights (red pointLight in act-agent, ambientLight in act-tools) were presumably added intentionally to compensate for darker baseline scene lighting. Confirm whether the desire was for per-act lighting accents or whether they're vestigial from earlier tuning passes before scene-lighting was finalized.

**Status:** DONE_WITH_CONCERNS
**Summary:** 4 must-fix issues (1 perf allocation, 4 texture leaks across 2 files counted as 1 class, 1 cursor leak, 1 shadow-plane mismatch). All other findings are should-fix or nits. Spec compliance unaffected.
