# Bottle authenticity rebuild

**Branch:** redesign/polish-pass-3 (continuing — same PR)
**Triggered by:** User: *"still horrendous the bottles are just bad, level up use ur brain and start with the bottle shape and viewability of the words"*
**Methodology:** superpowers:subagent-driven-development
**Start:** 2026-06-06 19:47 ET

## Diagnosis

Two compounding failures:

1. **The bottle glass is red.** Historic Coca-Cola contour bottles are **Georgia green** — that's the iconic look. On our red world, red glass disappears into the background. Green glass would pop with the strong red label.
2. **Wordmark and labels are far too small to read** at the chapter camera distance. The current wordmark plane is 0.34 × 0.1 units; the crate's neck-tags are similar order. Text needs to scale ~2.5× to be legible.

Plus minor silhouette refinements: the belly peak sits too low, the shoulder S-curve transitions too steeply, and surface segments are visible at close range.

## Phases

| # | Title | Files | Status |
|---|---|---|---|
| B | Authentic Coca-Cola bottle (green glass, crown cap, readable wordmark) | `scene/brand/coke-bottle.tsx`, `scene/brand/coke-bottle-geometry.ts` | pending |
| L | Tools-act neck-tag readability | `scene/acts/act-tools.tsx` | pending |

File-disjoint. Parallel-safe.

## Phase B detail

### Material — Georgia green glass

Change main glass color from current `#8B0008` (deep red) to **Georgia green**: `#2F4D2A` or similar dark desaturated green. Subtle emissive `#1A2D14` (low intensity) for warmth. Clearcoat=1, clearcoatRoughness=0.06. Opacity ~0.85 so any internal liquid (when `interior` prop is used) shows through. **No transmission** (perf rule). The HDR env (Foundation phase) provides reflections.

Tinted-glass effect: the body uses green color, but the embedded rib geometry stays slightly lighter green for the highlight catch.

### Silhouette refinement

Profile points: bump from 40 → ~70 for smoother lathe. Specifically:
- Belly peak moves UP from y=0.37 → y=0.44 (more middle-low placement, closer to real Coke bottle)
- Smoother S-curve from waist (~y=0.62) to shoulder bulge (~y=0.80) — add 4–6 intermediate samples
- Neck taper from shoulder to cap stays similar but with more sample points

Lathe segments: bump from 64 → 96 for smoother surface revolution at close range.

### Label band — bigger, bolder

- Height: 0.26 → 0.42 (covers more of the belly)
- Centered y: 0.46 → adjusted to wrap belly with new geometry (around y=0.42 with new profile)
- Color: classic Coca-Cola red `#F40009` (unchanged)
- Position: lower-mid belly so the wordmark sits centered visually
- Slight emissive `#A60010` at intensity 0.2 so the label has presence under low light

### Wordmark — large and readable

When `showLogo=true` and `customLabel` is undefined:
- Plane size: 0.34 × 0.10 → **0.62 × 0.18** (bigger)
- Position: matched to new belly geometry
- `useLogoTexture` already returns a CanvasTexture from the official Coca-Cola SVG; keep that

When `customLabel` is provided:
- Replace plane with `<Text>` with **fontSize 0.085 → 0.13**, **maxWidth 0.32 → 0.52**, outlineWidth 0.012 → 0.016, slight tracking. Cream color `#FFFEF6`, dark outline `#0A0203` (unchanged).

### Crown cap (replace screw cap)

Drop the current cylinder cap + cap-top disc. Replace with a proper **crown cap**:
- Main disc: short cylinder, radius 0.165, height 0.03 (very thin), color `#F40009` (red enamel) with subtle metalness 0.3 + clearcoat 0.5 for paint sheen
- 21 small radial flute crimps around the rim — use instancedMesh of small boxes or wedges, in slightly darker red `#A60010`, like the crimped bottle cap in act-role's prior iteration (reference the flute placement pattern but smaller)
- A tiny center embossed white wordmark stamp on top (small white plane with the logo texture) — only when not under heavy occlusion

### Acceptance — Phase B

- Glass renders green-tinted with the HDR env catching highlights
- Wordmark clearly readable from the chapter camera distance
- Crown cap visible with crimped rim
- Smoother silhouette at close range (no visible facets)
- All consumers (vending-machine slots, act-tools crate, act-bottle takeaways) still render correctly
- `npm run build` passes; runtime console clean

## Phase L detail

The crate's paper neck-tags (drawn as CanvasTextures) are too small to read. Audit and uplevel:

- Tag plane size: bump width/height ~2× so the tag is clearly visible
- CanvasTexture canvas resolution: bump from current to 512×384 minimum
- Font: bigger, higher contrast, dark ink on aged cream paper, **typewriter-flavor serif** for period feel
- Tag positioning on bottle neck: re-verify after Phase B's geometry tweaks (neck position may shift)

### Acceptance — Phase L

- Tool name on each tag readable without zooming in
- Tag positioned cleanly on the bottle neck (doesn't clip into glass)
- `npm run build` passes

## SDD review gate

Each phase: implementer → spec review → quality review → commit. Final code review across both phases before merge.

## Project hard rules

- **NO transmission materials anywhere** (perf rule). Green glass is achieved via meshPhysicalMaterial with clearcoat + emissive — the HDR env replaces the transmission look.
- Each phase touches only owned files.
