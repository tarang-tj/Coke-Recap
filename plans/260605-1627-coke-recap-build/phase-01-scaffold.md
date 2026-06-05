# Phase 1 — Scaffold

**Mode:** sequential
**Status:** pending
**Depends on:** —

## Goal
Working Vite + React + TS app booting with Tailwind, Three.js, and R3F installed. No 3D content yet — just a black canvas filling the viewport.

## Steps
1. `npm create vite@latest . -- --template react-ts` (in repo root; merge into existing files).
2. Install runtime deps: `three @react-three/fiber @react-three/drei maath`.
3. Install dev deps: `@types/three tailwindcss postcss autoprefixer leva`.
4. `npx tailwindcss init -p`. Configure `tailwind.config.js` content globs.
5. Replace `src/App.tsx` → `src/app.tsx` (kebab-case). Same for entry.
6. Create empty skeleton dirs: `src/{scene,scene/acts,ui,ui/sections,hooks,shaders,data,utils,styles}`.
7. Create `src/styles/tokens.css` with brand color CSS variables.
8. Create `src/styles/globals.css` (Tailwind directives + token import + body reset).
9. Mount an empty fullscreen `<Canvas />` from `@react-three/fiber` at the root.
10. `npm run dev` → verify black canvas, no errors.

## Acceptance
- `npm run build` succeeds.
- Dev server starts cleanly.
- Canvas covers viewport; document height = 100vh (will grow in phase 2).
- All file names kebab-case.

## Risks
- Vite scaffold may write `App.tsx` / `App.css`; rename to kebab-case immediately.
- Tailwind v4 install differs from v3 — follow whatever the current docs say; either version is fine.
