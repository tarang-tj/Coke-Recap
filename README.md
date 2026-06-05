# Coke-Recap

An interactive 3D portfolio summarizing my Global Human Insights internship at The Coca-Cola Company.

The site is one continuous scrollytelling scene — a "Liquid Universe" where the camera floats through a Coca-Cola-red liquid and morphs through five Acts:

1. **Cold Open** — a floating glass droplet
2. **Role** — a refracting sphere wrapped in glowing data streams
3. **Tools** — six frosted-glass cubes (NIQ, PowerBI, DAX, SQL, Python, internal tooling)
4. **Agent** — a luminous nebula core with orbiting rings (Ingest / Analyze / Surface) — the AI consumer marketing metrics agent
5. **Bottle** — the camera pulls back to reveal the whole scene was inside a glass Coke bottle

## Content policy

**Zero specifics.** No internal data, no real metric names, no real campaign names, no proprietary architecture. Tool names are shown alongside generic descriptions; the agent project is described conceptually only.

## Stack

- Vite + React 19 + TypeScript
- `@react-three/fiber` + `@react-three/drei` + `three`
- Tailwind CSS
- `maath` for easing, `leva` for dev-only tuning

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build      # production bundle to dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

## Architecture notes

- A single persistent `<Canvas>` is mounted at the app root. Acts mount inside it as time-windowed scene-graph children — they never unmount on scroll.
- One source of scroll truth: `useScrollProgressRef()` returns a `RefObject<number>` shared via context. Acts read it inside `useFrame` — zero React re-renders on scroll.
- The camera is owned exclusively by `src/scene/camera-rig.tsx`. Individual acts may never move or look-at the camera.
- All copy lives in `src/data/portfolio-content.ts`.
- All scroll windows live in `src/data/act-windows.ts`.

## Deploy

Production target: Vercel. `vercel.json` sets SPA rewrites and immutable caching for hashed assets.

## Design + plan

- Design spec: `docs/specs/2026-06-05-coke-recap-design.md`
- Implementation plan: `plans/260605-1627-coke-recap-build/`

— Tarang Jammalamadaka
