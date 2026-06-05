# Phase 3 — Fluid Environment

**Mode:** sequential
**Status:** pending
**Depends on:** Phase 2

## Goal
The always-on liquid backdrop. A full-scene volumetric red liquid with rising bubbles, present from Act 0 through Act 4. This is the "universe" the camera lives inside.

## Steps
1. `src/shaders/liquid.vert.glsl` — standard MVP + screen-space UV pass-through.
2. `src/shaders/liquid.frag.glsl`:
   - Curl-noise driven by `uTime` and camera position.
   - Two-layer ramp (Coke red → deeper crimson at depth).
   - Subtle vertical caustic banding for "viscous" feel.
   - Vignette for focal pull.
3. `src/scene/fluid-environment.tsx`:
   - Renders a large back-facing sphere centered on the camera (camera lives inside it).
   - Custom `ShaderMaterial` with the liquid shaders.
   - Uniforms: `uTime`, `uReducedMotion`, `uActT` (global scroll, lets the fluid hue shift subtly per act).
4. Bubble particles:
   - `THREE.Points` with ~400 particles (decimate on mobile to ~120).
   - Custom shader: each particle has a random rise speed + horizontal wobble (sin-based).
   - Recycle bubbles that exit the top frustum back to the bottom.
   - Tinted off-white with additive blending.
5. Hook fluid environment uniforms to scroll: hue slightly warms in the bottle act (Act 4), cools in agent act (Act 3).

## Acceptance
- 60fps on M1 MBP at full DPR.
- 30fps minimum on iPhone 12.
- No visible polygon edges on the back-sphere.
- Bubbles wrap seamlessly.
- Reduced-motion freezes bubble rise + slows curl noise to a crawl.

## Risks
- Curl noise in fragment shader = expensive. Fallback: pre-baked noise texture sampled with parallax.
- Mobile fillrate. Mitigation: render the fluid to a half-res offscreen buffer and upsample.
