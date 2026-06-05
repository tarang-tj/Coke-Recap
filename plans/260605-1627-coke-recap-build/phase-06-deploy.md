# Phase 6 — Deploy

**Mode:** sequential
**Status:** pending
**Depends on:** Phase 5

## Steps
1. `vercel.json` — SPA rewrites to `/index.html`, cache headers for `/assets/*` (immutable).
2. `README.md` — overhaul: project blurb, screenshot, stack, local dev, deploy notes. Keep zero-specifics policy front-and-center for anyone forking.
3. `.gitignore` — verify `node_modules`, `dist`, `.env*`, `.vercel` ignored.
4. Run final `npm run build`; sanity-check `dist/` size.
5. Commit + push to `main` on `github.com/tarang-tj/Coke-Recap`.
6. (User does) Connect Vercel project to repo, confirm deploy, optionally point a custom domain.

## Acceptance
- Live URL reachable.
- First load LCP < 2.5s on a fast connection.
- No mixed-content warnings.
