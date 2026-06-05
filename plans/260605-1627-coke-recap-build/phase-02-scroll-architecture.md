# Phase 2 — Scroll Architecture

**Mode:** sequential
**Status:** pending
**Depends on:** Phase 1

## Goal
Lock the interface contracts every act will read from: scroll progress, act windows, and the camera rig API. Make the page actually scrollable.

## Steps
1. Set body height: page wrapper at `min-height: 500vh` (5× viewport, one per act).
2. `src/hooks/use-scroll-progress.ts` — listens to `window` scroll, returns `0..1` normalized, throttled via `requestAnimationFrame`. Returns the same `useRef` value to skip re-renders; exposes a subscribe API for R3F frame loop.
3. `src/data/act-windows.ts`:
   ```ts
   export type ActId = 'cold-open' | 'role' | 'tools' | 'agent' | 'bottle';
   export const ACT_WINDOWS: Record<ActId, [number, number]> = {
     'cold-open': [0.00, 0.18],
     'role':     [0.18, 0.38],
     'tools':    [0.38, 0.60],
     'agent':    [0.60, 0.82],
     'bottle':   [0.82, 1.00],
   };
   ```
4. `src/hooks/use-act-window.ts` — given an `ActId`, returns `{ active, localT, globalT }`. `localT` is `smoothstep`-ed; export the raw form too for camera math.
5. `src/scene/scene-root.tsx` — wraps the `<Canvas>`, sets DPR, attaches `Suspense`, mounts placeholder `<CameraRig />`.
6. `src/scene/camera-rig.tsx` — single component owning camera position + lookAt. Reads scroll progress in `useFrame`; interpolates between 5 keyframes (one per act) using a Catmull-Rom curve via `THREE.CatmullRomCurve3`. Initial keyframes can be rough placeholders; acts will not move the camera.
7. `src/ui/section-overlay.tsx` — flex container of section placeholders, one per act, each `100vh` tall with semi-transparent debug labels so we can sanity-check alignment.
8. Verify scroll updates a debug overlay (e.g., bottom-left) showing current global `T` and active act.

## Interface contract (DO NOT BREAK after lock)
```ts
useScrollProgress(): number;
useActWindow(id: ActId): { active: boolean; localT: number; globalT: number };
ACT_WINDOWS: Record<ActId, [number, number]>;
```

## Acceptance
- Scrolling moves the camera through 5 keyframes.
- Debug overlay shows correct active act per scroll position.
- No re-renders of acts when scrolling (verify with React Profiler).
- Page is 500vh tall; canvas is sticky.

## Risks
- React state-driven scroll = re-render hell. Mitigation: read scroll from `useRef` inside `useFrame`, not state.
