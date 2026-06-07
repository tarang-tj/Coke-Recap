# Consolidated SDD Review — `redesign/polish-pass-3`

Build: `npx vite build` — PASS.
Scope: Phases B, L, T, H of `260606-2031-reference-driven-rebuild`.

---

### Phase B — Reference-true bottle

**SPEC: APPROVED-WITH-FIXES**

| Spec item | Status | Evidence |
|---|---|---|
| Glass color `#DCE0DC`, no emissive | YES | `coke-bottle.tsx:29` `GLASS_COLOR='#DCE0DC'`; no `emissive` prop on body material (L249-261); old `GLASS_EMISSIVE` removed |
| Belly max radius ~0.24 | YES | `coke-bottle-geometry.ts:42` `[0.240, 0.420]` peak |
| `buildLiquidGeometry()` exported | YES | `coke-bottle-geometry.ts:146`, imported `coke-bottle.tsx:24` |
| Liquid mesh `#3D1E0F` + emissive lerp on highlight | YES | L222-233 mesh + L199-204 `useFrame` lerps 0.18 → 0.45 |
| Meniscus disc at liquid top | YES | L236-246 at `y=1.06`, r=0.082 |
| Red label band REMOVED | YES | grep confirms no `LABEL_RED`, no `labelGeo`, no `microstrip`, no `wordmarkPlane` anywhere |
| Crown cap 21 crimps + wordmark | YES | `CRIMP_COUNT=21` L43; cap geometry L120-153 |
| `CokeBottleProps` API preserved; `interior` no-op | YES | L57-81 interface unchanged; `interior:_interior` accepted-but-ignored L166 |
| No transmission | YES | grep confirms only comments mentioning transmission, no `transmission` prop |

**QUALITY:**

- **Must-fix:** none.
- **Should-fix:**
  - Meniscus rotation is `[-Math.PI/2, 0, 0]` (spec wrote `[Math.PI/2, 0, 0]`). Negative sign makes the disc's front-face point upward toward viewer — defensible, but verify against the spec author. If reverted, the meniscus will only render from below and look invisible. Currently RIGHT, but worth annotating.
  - In `BottleInCrate`, no `customLabel` is passed — so every one of the 6 crate bottles renders the upper-neck "Coca-Cola" embossed `<Text>` *behind* its paper tool-tag. Spec says `customLabel` "now overrides the upper-neck embossed wordmark", implying the embossed text is the default everywhere. If you don't want both showing on crate bottles, pass `customLabel=""` or add a `showEmboss` toggle. Visual call.
  - `bodyGeo`, `flutesGeo`, and `liquidGeo` are `useMemo`'d per-instance (≈8 bottles × 3 geometries = 24 LatheGeometries). Could be hoisted to module-level singletons for ~80% memory reduction. Low-priority — bottle count is small.
- **Nit:**
  - `hRef.current = highlight` assigned every render (L197) — could simply close over `highlight` inside `useFrame`. R3F closures re-bind on rerender so the ref is unnecessary; harmless.
  - `MENISCUS_R = 0.082` constant repeats math that could be derived once via `profileRadiusAt(profile, 1.05) - 0.012`, matching the liquid lathe inset. Minor DRY win, keeps meniscus and liquid in lockstep if profile changes.

---

### Phase L — Lighting + post tone-down

**SPEC: MATCHES**

| Setting | Spec | Actual | Status |
|---|---|---|---|
| dir intensity | 0.85 | 0.85 (`scene-lighting.tsx:16`) | YES |
| hemi intensity | 0.22 | 0.22 (L24) | YES |
| point intensity / distance | 1.0 / 7 | 1.0 / 7 (L29, L31) | YES |
| ambient intensity | 0.08 | 0.08 (L36) | YES |
| bloom intensity / threshold | 0.30 / 0.93 | 0.30 / 0.93 (`postprocessing-stack.tsx:39-41`) | YES |
| vignette darkness | 0.90 | 0.90 (L44) | YES |
| noise opacity | 0.06 | 0.06 (L29, L47) | YES |
| low-perf branch consistent | required | identical vignette/noise values in fallback | YES |

**QUALITY:**

- **Must-fix:** none.
- **Should-fix:** none.
- **Nit:** numeric literal `0.025` for `luminanceSmoothing` matches spec "keep at ~0.025". Fine.

---

### Phase T — Takeaways bottle reposition

**SPEC: MATCHES**

| Item | Status |
|---|---|
| Lower bottle by ~0.7 inside `useFrame` after envelope-active gate | YES — `act-bottle.tsx:30` `group.position.y = -0.7;` set inside `if (!visible) return;`-gated block (L23-30) |
| Entrance dive preserved | YES (`position.z` lerp + scale lerp still applied L25-26) |

**QUALITY:**

- **Must-fix:** none.
- **Should-fix:**
  - At peak `scale=2.2`, the −0.7 parent-space offset is only ≈0.32 bottle-local units. Bottle's vertical center is at world y ≈ `2.2 × 0.775 − 0.7 = 1.005`. If "viewport center" means world-y=0, this is still high. Designer should eyeball; may need a larger offset (-1.4) or scaling the offset with `mix`.
  - `position.y` is set unconditionally every frame after the visible gate — fine, but could move into the entry block once. Negligible perf.
- **Nit:** none.

---

### Phase H — Historical tidbits

**SPEC: APPROVED-WITH-FIXES**

| Location | Required text | Status |
|---|---|---|
| `start-gate.tsx` hint | `1886 · ATLANTA · INVENTED BY JOHN S. PEMBERTON` (lowercase variant in spec) | YES — L121, lowercase + bullet separators verbatim |
| `act-role.tsx` brass plate | `CONTOUR BOTTLE · PATENTED 1915 · ROOT GLASS CO.` | YES — L346 |
| `act-tools.tsx` crate plate | `FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS` | YES — L675, **inside `crateGroupRef`** ✓ |
| `act-agent.tsx` plinth plate | `FIRST SERVED · JACOBS' PHARMACY · MAY 8, 1886` | YES — L453, inside main `groupRef` ✓ |
| `chapter-overlay.tsx` takeaways DOM | `SOLD FOR 5¢ FROM 1886 – 1959 · 73 YEARS AT THE SAME PRICE` conditional on `view==='takeaways'` | YES — L72-76, conditional + lowercase variant per spec |

**QUALITY:**

- **Must-fix:**
  - **Z-fighting risk on brass-plate texts.** Plate box is depth 0.015 (front face at plate-center + 0.0075). Text z-offsets are razor-thin:
    - `act-tools.tsx:667` — plate center at `CRATE_D/2 + 0.012 = 0.612`, plate front face at z≈0.6195. Text at z=0.620 → only **0.0005** in front of plate face. Will flicker.
    - `act-agent.tsx:445` — plate at z=0.78, front face at z≈0.7875. Text at z=0.788 → only **0.0005** in front. Will flicker.
    - `act-role.tsx:338` — plate at z=0.10, front face at z≈0.1075. Text at z=0.112 → 0.0045 in front. Borderline OK but tight.
    Fix: bump text z to plate-front + 0.005 minimum (e.g., text z = plate.z + 0.013 for all three).
- **Should-fix:**
  - **act-tools plate is on the back-short wall, not the long wall with the stencil.** File geometry: front wall at −Z (`L343`, "Front wall (−Z, faces camera)"), back wall at +Z (`L349`). Plate is positioned at +Z (`L662` `CRATE_D/2 + 0.012`), i.e. the **back** wall — opposite the camera at idle. Crate rotates at 0.018 rad/s so it eventually faces forward, but the spec intent was clearly "below the existing stencil." The stencil lives on the −X **left long wall** (`L355`). Either move the plate to −X (matching stencil) or to −Z (front wall facing camera). Currently it shows up on the back of the crate.
  - `letterSpacing={0.08}` on `act-role.tsx:343` is slightly tighter than the other two plates (0.06). Pick one for cross-plate consistency.
- **Nit:**
  - `act-role.tsx`, `act-tools.tsx`, `act-agent.tsx` are 350/692/457 lines — exceed 200-line file-size rule from `development-rules.md`. Pre-existing condition (Phase H didn't make this worse); future refactor candidate.

---

### OVERALL

**Status:** APPROVED-WITH-FIXES

**Must-fix count:** 1 (three sub-instances of the same z-fighting bug on brass plate texts in H).

**Top 3 recommendations:**
1. **Bump brass-plate Text z-offsets** in `act-tools.tsx:667`, `act-agent.tsx:445` (and tighten `act-role.tsx:338` for consistency). Pattern: text z = plate z + plate-depth/2 + 0.005.
2. **Reconsider tools-crate plate placement.** It's on the +Z back wall, not below the −X stencil. Move to `position={[-(CRATE_W/2 + 0.012), -CRATE_H*0.15, 0]}` with rotation `[0, -Math.PI/2, 0]` (or any other camera-facing surface).
3. **Verify takeaways bottle visual centering** with the −0.7 offset at scale 2.2 — math suggests bottle center sits at world y≈+1.0, still high. Likely needs −1.2 to −1.5.

### Unresolved Questions

- Spec for meniscus was `rotation={[Math.PI/2,0,0]}`; impl uses negative. Visually correct (disc faces up) — was the spec a typo?
- Phase B: should crate bottles suppress the upper-neck embossed "Coca-Cola" text (currently doubles up with the paper tool-tag)? If yes, recommend passing `customLabel=""` and adding an early-return inside the bottle to skip Text on empty string, or adding a `showNeckEmboss` prop.
- Phase T: what's the exact "viewport center" target — world-y=0 or somewhere visually centered against the chapter copy column?
