# Coke-Recap — Liquid Universe Portfolio (Design Spec)

**Date:** 2026-06-05
**Status:** Approved
**Owner:** Tarang Jammalamadaka

## Purpose

A single-page interactive 3D portfolio summarizing Tarang's Global Human Insights internship at Coca-Cola. Conveys role, tools, and the AI Consumer Marketing Metrics Agent project — without exposing any internal data (zero-specifics policy).

## Visitor Outcome

Within 30 seconds, a recruiter or peer should:
1. Understand the role (AI martech × consumer marketing data).
2. See the tool stack at a glance (NIQ, PowerBI, DAX, SQL, Python, internal tool).
3. Grasp the agent project conceptually.
4. Walk away with a "that was cool" reaction strong enough to share.

## Concept

**Persistent morphing 3D scene.** One `<Canvas>` mounted at the app root; never unmounts. The camera lives inside a swirling Coca-Cola–red liquid universe. Scrolling advances the camera through five Acts. UI section overlays fade in over the canvas.

### Why this design
- Persistent canvas eliminates rebuild jank typical of scrollytelling 3D.
- Acts are time-windowed scene-graph children, not unmounted components → trivially testable and parallelizable across implementers.
- Single source of scroll truth → one normalized progress value drives all animation. No conflicting timelines.
- Liquid metaphor is on-brand (Coca-Cola is a beverage), avoids cliché vending-machine skeumorphism.

## Acts

### Act 0 — Cold Open (scroll 0.00–0.18)
- Camera floats in a near-black void; one large Coke-red liquid droplet centered.
- Bubbles rise inside the droplet (curl-noise particle field).
- UI overlay: name + "Global Human Insights Intern @ Coca-Cola". Scroll hint.

### Act 1 — Role (0.18–0.38)
- Camera dives through the droplet's surface tension into a luminous chamber.
- Glowing data streams wrap a central refracting glass sphere.
- UI overlay: 2–3 sentences on AI martech × consumer marketing data theme.

### Act 2 — Tools (0.38–0.60)
- Chamber dissolves; camera slaloms through a constellation of frosted-glass cubes.
- Cubes: NIQ, PowerBI, DAX, SQL, Python, "Internal Tool" — etched-glass labels, refract liquid behind.
- UI overlay: one-line description per tool (rendered as a side panel timed to cube proximity).

### Act 3 — Agent (0.60–0.82)
- Camera approaches a luminous nebula core at scene center.
- Orbiting rings labeled Ingest / Analyze / Surface synchronize on scroll.
- UI overlay: conceptual description of the agent ("turns dashboards into conversations").

### Act 4 — Bottle (0.82–1.00)
- Camera pulls all the way back. Entire prior scene revealed inside a slowly rotating glass Coke bottle.
- UI overlay: 3 learning bullets, contact links (GitHub, LinkedIn, email).

## Tech Stack

- **Build:** Vite + TypeScript + React 18
- **3D:** `@react-three/fiber`, `@react-three/drei`, `three`
- **UI:** Tailwind CSS
- **Easing/math:** `maath`
- **Dev tuning:** `leva` (dev-only, tree-shaken in prod)
- **Deploy:** Vercel, static SPA

## Architecture

### Single Source of Scroll Truth
```ts
useScrollProgress(): number  // 0..1 across the document
```
Every animation derives from this. Each act has a `[start, end]` window; visibility/animation interpolates within its window.

### Scene Graph
```
<App>
  <SceneRoot>                        // persistent Canvas
    <FluidEnvironment />             // liquid background + bubbles, always on
    <CameraRig />                    // scroll-driven path
    <ActColdOpen />
    <ActRole />
    <ActTools />
    <ActAgent />
    <ActBottle />
  </SceneRoot>
  <SectionOverlay>                   // DOM, sticky/scroll-positioned
    <ColdOpenSection />
    <RoleSection />
    <ToolsSection />
    <AgentSection />
    <LearningsSection />
  </SectionOverlay>
  <Loader />                         // bottle-fill loader for first paint
</App>
```

### File Layout
```
src/
  app.tsx
  main.tsx
  scene/
    scene-root.tsx
    camera-rig.tsx
    fluid-environment.tsx
    acts/
      act-cold-open.tsx
      act-role.tsx
      act-tools.tsx
      act-agent.tsx
      act-bottle.tsx
  ui/
    section-overlay.tsx
    scroll-indicator.tsx
    reduced-motion-toggle.tsx
    sections/
      cold-open-section.tsx
      role-section.tsx
      tools-section.tsx
      agent-section.tsx
      learnings-section.tsx
  shaders/
    liquid.frag.glsl
    liquid.vert.glsl
    glass-cube.frag.glsl
    nebula.frag.glsl
  hooks/
    use-scroll-progress.ts
    use-act-window.ts          // returns 0..1 within an act's [start,end]
    use-reduced-motion.ts
  data/
    portfolio-content.ts       // ALL copy lives here
    act-windows.ts             // central [start,end] table
  utils/
    perf.ts
    easing.ts
  styles/
    tokens.css                 // brand colors as CSS vars
    globals.css
```

### Interface Contracts (lock these first)

```ts
// hooks/use-scroll-progress.ts
export function useScrollProgress(): number;

// hooks/use-act-window.ts
export function useActWindow(actId: ActId): {
  active: boolean;            // any animation should run
  localT: number;             // 0..1 within the act's window
  globalT: number;            // 0..1 across the whole page
};

// data/act-windows.ts
export const ACT_WINDOWS: Record<ActId, [number, number]>;
export type ActId = 'cold-open' | 'role' | 'tools' | 'agent' | 'bottle';

// scene/camera-rig.tsx
// Reads useScrollProgress, drives the camera position + look-at via a
// keyframed curve. No act may move the camera directly.
```

Once these are merged, all five acts and all five overlay sections can be developed in parallel by separate implementers, each owning their own files.

## Brand Tokens

```
--coke-red:    #F40009
--coke-black:  #1B1B1B
--cream:       #F1E9DA
--caramel:     #A06A00
--off-white:   #FFFEF6
```

Typography: a strong display serif for headlines (Playfair Display or similar), a clean grotesque for body (Inter). All sizes use a fluid `clamp()` scale.

## Performance Budget

- **First Contentful Paint:** < 1.5s on 4G simulated
- **Largest Contentful Paint:** < 2.5s
- **Total JS (gzip):** < 700 KB (Three.js dominates; that's fine)
- **Frame budget:** 16ms on M1 MBP, 33ms on iPhone 12

### Tactics
- DPR cap: 1.5 mobile, 2 desktop.
- Adaptive particle counts based on `navigator.hardwareConcurrency`.
- Suspense + lazy import per act (act bundles split).
- `prefers-reduced-motion` fallback: skip camera dolly, dampen liquid, fade between acts via opacity.
- Drei `<Loader />` styled as a Coke bottle filling vertically.

## Accessibility

- All section copy lives in the DOM (overlay), keyboard-navigable.
- Section anchors via `id` + skip-to-content link.
- "Skip intro" button jumps to the agent section.
- Reduced-motion respected by default; manual toggle in corner.
- Color contrast ≥ 4.5:1 for body text (cream on coke-black satisfies).

## Content (Zero-Specifics Policy)

All copy lives in `src/data/portfolio-content.ts`. Tarang fills it in. Stubs:

- **Hero**: name + role + tagline
- **Role**: 2–3 sentence blurb on AI martech × consumer marketing
- **Tools**: one short description per tool, no proprietary details
- **Agent**: conceptual paragraph — purpose, audience, what it changes (no architecture, no data sources)
- **Learnings**: 3 bullet takeaways
- **Contact**: GitHub, LinkedIn, email

Nothing referencing internal datasets, real metric names, real campaign names, or any data Coca-Cola classifies as confidential.

## Risks & Fallbacks

| Risk | Fallback |
|------|----------|
| Real-time fluid shader too heavy | Animated curl-noise + parallax cubemap (no real fluid sim) |
| Motion sickness from camera dolly | Reduced-motion toggle + skip-intro |
| Bundle > 700KB after Three.js | Drop drei extras (`<Loader>` custom, `<Html>` only where needed); per-act code split |
| Mobile thermals | Adaptive DPR, particle decimation, freeze fluid sim when offscreen |
| "Liquid scrollytelling" feels generic | Typography + brand-color discipline + careful easing curves are the differentiator |

## Out of Scope

- CMS / blog
- i18n
- Analytics beyond Vercel default
- Contact form (mailto link only)
- Dark/light theme toggle (always dark)

## Open Questions

None at design lock. Content copy is Tarang's to fill in after scaffold lands.
