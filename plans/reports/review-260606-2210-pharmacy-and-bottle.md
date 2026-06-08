# Code Review — polish-pass-4 (Phases B + J)

Branch: `polish-pass-4`
Build: PASS (npm run build → ✓ built in 2.48s; tsc clean)
Reviewer pass: spec-gate + quality-gate

---

## Phase B — bottle profile + dark liquid + glass tint

### SPEC: ✅ (with one annotation)

Per-item verification (against `phase-B-bottle.md`):

| Spec item | File:line | Status |
|---|---|---|
| `buildContourProfile()` rewritten | coke-bottle-geometry.ts:15-104 | ✅ |
| Belly peak r=0.27 first reached at y=0.56, max sustained through y=0.68 | coke-bottle-geometry.ts:43-49 | ✅ (max-r y=0.62 is inside the plateau, per spec "sustained 0.56→0.72") |
| Profile point count ~65-70 | coke-bottle-geometry.ts (65 entries) | ✅ |
| Profile monotonic in y, no duplicates | verified numerically | ✅ |
| Rib y range 0.06→0.65 (was 0.54) | coke-bottle-geometry.ts:176-177 | ✅ |
| `buildLiquidGeometry()` yEnd=0.96 | coke-bottle-geometry.ts:141 | ✅ |
| `GLASS_COLOR = '#D0DDD2'` | coke-bottle.tsx:29 | ✅ |
| Glass opacity 0.22 (body + ribs) | coke-bottle.tsx:260, 276 | ✅ |
| `LIQUID_COLOR = '#0A0503'` | coke-bottle.tsx:33 | ✅ |
| `LIQUID_EMISSIVE = '#1A0D05'` | coke-bottle.tsx:34 | ✅ |
| Emissive base 0.05 / highlight 0.18 | coke-bottle.tsx:35-36 | ✅ |
| `MENISCUS_Y = 0.96` | coke-bottle.tsx:39 | ✅ |
| `MENISCUS_R = profileRadiusAt(profile, 0.96) - 0.012` | coke-bottle.tsx:214 | ✅ (formula matches; computed value = 0.183, NOT spec's ≈0.143 — see Annotation below) |
| Upper-neck embossed wordmark at y=1.20 | coke-bottle.tsx:283, 298 | ✅ |
| Neck-ring torus repositioned (~y=1.39) | coke-bottle.tsx:314 | ✅ (y=1.390) |
| `CokeBottleProps` API preserved | coke-bottle.tsx:58-82 | ✅ (all 10 prop names + `BottleInteriorProps` retained) |
| No transmission materials | grep'd: only one comment reference | ✅ |

**Annotation (spec internal inconsistency, NOT an implementation bug):**

The spec table at phase-B-bottle.md:137 says `MENISCUS_R ≈ 0.143`. The formula it specifies (`profileRadiusAt(profile, 0.96) - 0.012`) produces 0.183 given the landmark table. At y=0.96 the spec's own landmarks place the profile mid-shoulder-taper, not in the neck cylinder; the "≈0.143" annotation is wrong arithmetic. Code follows the formula correctly. **No code change required** — but worth flagging back to the spec author so the same author doesn't re-flag this on next pass.

### QUALITY

**Must-fix:** none

**Should-fix:**
- coke-bottle.tsx:281-311 — `customLabel ? ... : ...` ternary renders two near-identical `<Text>` blocks differing only in body content. Collapse to one `<Text>{customLabel ?? 'Coca-Cola'}</Text>` to DRY the seven shared props.

**Nit:**
- coke-bottle-geometry.ts:9 — header doc says "Belly peak radius ≈ 0.27 at y ≈ 0.62" — correct as the *center of the sustained plateau*. Could clarify it's a plateau (y=0.56→0.68), not a single point, for future readers.
- coke-bottle.tsx:11 — header comment "Neck ring torus at y=1.39" — fine; the inline comment on line 313 says "y ≈ 1.39 per new profile" while spec table says 1.40. Both within the collar swell band; not a defect.
- coke-bottle.tsx:200-205 useFrame discipline ✅ — no setState, no per-frame allocations, refs used for highlight, lerp via dt; clean.
- Hook order stable: `useLogoTexture → useMemo → useMemo → useEffect → useRef → useFrame → useMemo` — all unconditional. ✅
- All manually-allocated geometries (`bodyGeo`, `flutesGeo`, `liquidGeo`) disposed in useEffect cleanup (coke-bottle.tsx:187-194). ✅

---

## Phase J — Jacobs' Pharmacy interior

### SPEC: ✅ (with two observations)

Per-item verification (against `phase-J-pharmacy.md`):

| Spec item | File:line | Status |
|---|---|---|
| File kebab-case + new | src/scene/jacobs-pharmacy.tsx | ✅ |
| Floor at y=-3.0, plane 10×8, `RepeatWrapping` 2×2 | jacobs-pharmacy.tsx:71-74, 331-338 | ✅ |
| Wall at z=-5.0, 12×7 plane | jacobs-pharmacy.tsx:341-344 | ✅ |
| Chair-rail brass strip at y=0.5, z=-4.95 | jacobs-pharmacy.tsx:347-350 | ✅ |
| 2 shelves: lower y=1.4, upper y=2.6, z=-4.6 | jacobs-pharmacy.tsx:276-278, 354-363 | ✅ |
| 4× `InstancedMesh` (2 body + 2 cap) × 6 instances = 12 jars | jacobs-pharmacy.tsx:366-387 | ✅ |
| Per-instance jar colors via `setColorAt` (amber/cobalt/opal/dark-green cycle) | jacobs-pharmacy.tsx:25, 240-241 | ✅ |
| Body material `vertexColors=true` | jacobs-pharmacy.tsx:368, 374 | ✅ |
| Caps shared single dark-wood material | jacobs-pharmacy.tsx:380, 386 | ✅ |
| Counter at x=3.5, z=-1.5, base+marble+brass+chrome jar+5 straws | jacobs-pharmacy.tsx:390-424 | ✅ |
| Marble texture procedural (cream + tan veining + grain) | jacobs-pharmacy.tsx:128-173 | ✅ |
| Pendant lamp at y=4.5, brass dome + emissive bulb + pointLight 0.8/dist=5/decay=1.5 | jacobs-pharmacy.tsx:427-464 | ✅ |
| Framed ad: brass frame + recessed plane, y=3.5, z=-4.9 | jacobs-pharmacy.tsx:467-479 | ✅ |
| Ad text: DELICIOUS · Coca-Cola · REFRESHING · 5¢ AT ALL FOUNTAINS | jacobs-pharmacy.tsx:197, 203, 209, 215, 221 | ✅ (vertical-stack layout with `· · ·` decorative row at y=375; spec explicitly allows newline separation) |
| `<JacobsPharmacy />` mounted inside machine-hub envelope group, BEFORE `<VendingMachine />` | machine-hub.tsx:46-47 | ✅ |
| Single import added | machine-hub.tsx:7 | ✅ |
| All 4 CanvasTextures baked in useMemo + disposed in useEffect | jacobs-pharmacy.tsx:253-267 | ✅ |
| No transmission materials | grep'd: only comment reference | ✅ |
| Reduced motion no-op (no animation) | verified | ✅ |

**Observation 1 — file size:**
Phase J spec asked to "stay under ~280 lines"; current file is **483 lines** (jacobs-pharmacy.tsx:1-483). Roughly 200 of those are the 4 CanvasTexture builders. Reasonable overage given inline texture recipes, but flagging since spec called it out. See Should-fix below for a refactor option.

**Observation 2 — `·` separator placement:**
Spec line 300 reads `DELICIOUS · Coca-Cola · REFRESHING · 5¢ AT ALL FOUNTAINS` as one continuous string with `·` separators. Implementation renders the four pieces as separate vertical fillText calls plus a single `· · ·` row at y=375. The spec text at lines 246-254 (the canvas recipe) explicitly draws them on separate y-lines (y=170/300/430/600), so the implementation matches that, not the one-line summary at line 300. **No defect.**

### QUALITY

**Must-fix:**
- jacobs-pharmacy.tsx:332 + scene-root.tsx:46 — **Contact-shadow / floor mismatch.** `<ContactShadows position={[0,-1.45,0]}>` is rendered scene-wide. Pharmacy floor sits at y=-3.0 (1.55u BELOW the contact-shadow plane). The vending machine cabinet base is around y=-2.85 (RoundedBox 5.6 tall centered at y=0 → base at y≈-2.8). Result: contact shadow renders floating at chest-height of the machine, ~1.4u above the new pharmacy floor — visually wrong (shadow detached from machine base AND not landing on the floor). Either: (a) move ContactShadows to y=-2.95 with `frames={1}` so it lands on the pharmacy floor under the machine, OR (b) gate the existing scene-wide ContactShadows visibility on `mixesRef.machine < 0.5` so it disappears when the pharmacy is active, OR (c) add a local ContactShadows inside `<JacobsPharmacy />` at y=-2.98 just under the machine footprint and disable the scene-wide one when machine is showing. Out of scope for "polish pass" only if user accepts the disconnect; in production-readiness terms it is a visible defect.

**Should-fix:**
- jacobs-pharmacy.tsx:457-463 — Pendant `pointLight intensity=0.8 color=#FFE4A0` stacks on top of the scene-lighting setup (scene-lighting.tsx:14-36: directional 0.85 cream, hemisphere 0.22, red point 1.0, ambient 0.08). Cream warm pendant overlaps cream warm key light — the machine front will be over-lit when the pharmacy is fully faded in. Either drop pendant intensity to ~0.5, or dim the scene-wide directional through the machine-envelope mix (out of scope here since spec forbids touching scene-lighting). Flag for visual QA — not a code bug, but a likely tuning regression.
- jacobs-pharmacy.tsx:280-306 — Four near-identical `useMemo` arrays for jar positions (lower-body, upper-body, lower-cap, upper-cap) — all use the same x-formula `-1.8 + i * 0.72`. Could collapse to a single `useMemo` returning `{lowerBody, upperBody, lowerCap, upperCap}` or generate inside the existing useEffect at 309-325. DRY win, minor.
- jacobs-pharmacy.tsx:309-325 — The useEffect applies instance matrices/colors once with `[lower/upperBodyPositions, lower/upperCapPositions]` as deps. Since those arrays are themselves `useMemo([])` (empty deps), the dep array is effectively static — fine, but consider explicit comment that this is "first mount only" so a future reader doesn't add a setter that doesn't re-run.
- File length 483 vs spec budget 280: extract the 4 CanvasTexture builders into `src/scene/jacobs-pharmacy-textures.ts` to bring this file to ~280. Not a correctness issue — DRY/maintainability only.

**Nit:**
- jacobs-pharmacy.tsx:230-231 — Module-scope `_m4` and `_col` shared scratch objects. Fine for single-component reuse; document if other consumers might import this file later.
- jacobs-pharmacy.tsx:243-244 — `mesh.instanceColor?.needsUpdate = true` guards against the first-frame race where `setColorAt` allocates the buffer. ✅
- jacobs-pharmacy.tsx:417 — `[-0.08, -0.04, 0, 0.04, 0.08] as const` straw offsets — `as const` here is fine but unnecessary since the values are spread into JSX positionally. Nit.
- jacobs-pharmacy.tsx:212-215 — The `· · ·` decorative row is a clever filler; could be replaced by two horizontal flourish strokes for stronger period feel. Visual nit only.
- jacobs-pharmacy.tsx:174 — `buildAdTexture` does not set `tex.colorSpace = THREE.SRGBColorSpace`. Floor/wall/marble also lack this. For procedural canvases with sRGB-encoded colors (which all four are), set `tex.colorSpace = THREE.SRGBColorSpace` so r3f's tone-mapper gamma-corrects properly. Currently the colors will read slightly dimmer/washed than intended.
- Hook order stable: `useMemo → useEffect → useRef × 4 → useMemo × 4 → useEffect → render`. All unconditional. ✅
- No `useFrame`, no setState anywhere. ✅
- `useMemo` deps: all `[]` (texture builders + position arrays) — correct since none reference props or state.

---

## OVERALL: ⚠️ APPROVED-WITH-FIXES

**Must-fix count: 1** (contact-shadow / pharmacy floor mismatch)

### Top 3 recommendations

1. **Resolve the contact-shadow disconnect** (scene-root.tsx:45-51 ↔ jacobs-pharmacy.tsx:331-338). Easiest path: drop a local `<ContactShadows position={[0,-2.95,0]} opacity={0.45} blur={2.5} far={3} resolution={512} />` inside `<JacobsPharmacy />` so the machine appears anchored to the new wood floor. Leaving the scene-wide one as-is keeps Role/Tools/Agent unchanged.

2. **Set `tex.colorSpace = THREE.SRGBColorSpace`** on all 4 procedural CanvasTextures (jacobs-pharmacy.tsx:70, 124, 172, 223). One-line each. Otherwise the wood/wall/marble/ad read 5-10% dimmer than the hex values intended.

3. **Fix spec-internal inconsistency in phase-B-bottle.md** (line 137: `MENISCUS_R ≈ 0.143`). Real computed value with current landmarks is 0.183. Either the landmarks at y=0.94→0.97 need to drop faster (impacting silhouette) OR the comment is just stale. Code is correct as-written; only the spec note is wrong. Flag back to spec author.

### Secondary

- DRY the two `<Text>` blocks in coke-bottle.tsx:281-311 (collapse to one block with `{customLabel ?? 'Coca-Cola'}`).
- Pendant pointLight stacking with scene key (likely visual over-bright on machine cabinet) — flag for visual QA.
- Consider extracting 4 CanvasTexture builders to `jacobs-pharmacy-textures.ts` to honor the spec's 280-line file budget.

---

## Unresolved questions

1. Is the contact-shadow plane intended to move with the machine envelope, or should the pharmacy add its own? Need direction before fixing — both are valid.
2. Is the pharmacy fully-opaque or does it inherit `envelope` opacity from scene-transition? Code mounts it inside the same group that gets `g.visible = mix > 0.002` (binary visibility), not a `material.opacity` fade. If a cross-fade is expected, materials would need an opacity-driven path; if hard-cut is intended, ignore.
3. Phase-B spec's `MENISCUS_R ≈ 0.143` annotation — should the landmarks be retuned to make that value real, or just delete the stale comment?
