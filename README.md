# Coke-Recap

An interactive 3D portfolio summarizing my Global Human Insights internship at The Coca-Cola Company.

The site is a single-viewport spatial experience (no scroll): a low-poly diorama of 1886 Five Points, Atlanta — Jacobs' Pharmacy, where Coca-Cola was first served. The camera flies between vantage points inside the diorama:

1. **Home** — wide establishing shot of the block; click the Coca-Cola vending machine to dispense a bottle and get the 30-second recap
2. **The Role** — three-quarter view of the pharmacy storefront
3. **The Stack** — the vending machine + delivery crates (NIQ, PowerBI, DAX, SQL, Python, internal tooling)
4. **The Agent** — down the working street; the AI consumer-marketing-metrics agent (Ingest / Analyze / Surface)
5. **Takeaways** — golden-hour pull-back over the whole block

Navigation: chapter pills (touch-friendly), keys 1–4, arrow keys, ESC for home, drag to look around.

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

- A single persistent `<Canvas>` is mounted at the app root; the whole town is one meshopt-compressed GLB (`public/assets/models/coca-cola-diorama.glb`).
- Navigation is a small view state machine (`src/scene/navigation-context.tsx`) — not scroll.
- The camera is owned exclusively by `src/scene/camera-rig.tsx`; all vantage poses live there. Nothing else may move or look-at the camera.
- The vending-machine recap (coin → bottle → panel) is driven by `src/scene/recap/recap-context.tsx`, spanning canvas + DOM.
- All copy lives in `src/data/portfolio-content.ts`.
- The HDR environment is self-hosted at `public/assets/hdr/warehouse-1k.hdr` (no runtime third-party CDN).

## Deploy

Production target: Vercel. `vercel.json` sets SPA rewrites and immutable caching for hashed assets.

## Design + plan

- Design spec: `docs/specs/2026-06-05-coke-recap-design.md`
- Implementation plan: `plans/260605-1627-coke-recap-build/`

— Tarang Jammalamadaka
