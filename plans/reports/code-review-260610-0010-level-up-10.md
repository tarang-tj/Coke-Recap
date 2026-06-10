# Code Review — polish-pass-10 vs polish-pass-9 (level-up 10)

Scope: `git diff polish-pass-9...polish-pass-10 -- src vercel.json` — 5 files, +114 LOC, 4 commits.
Files: src/app.tsx, src/scene/view-accent-lights.tsx (new), src/ui/chapter-overlay.tsx, src/ui/scene-loader.tsx, vercel.json.
Already verified upstream (not re-litigated): 27/27 behavioral checks, accent placement probe shots, tsc clean.

## Verdict

No critical issues. One Medium UI bug (loader jitter on phones), one High-informational caching caveat the commit message oversells, one mandatory post-deploy verification for the vercel.json semantics. Everything else clean.

## Critical

None.

## High

### H1. vercel.json override semantics — verified as designed, but confirm on the preview after deploy
`vercel.json:13-24`. Claim: later `/assets/models/(.*)` + `/assets/audio/(.*)` rules override the earlier blanket `/assets/(.*)` immutable rule for the same `Cache-Control` key.

Evidence gathered:
- Vercel's routing layer applies header rules **in array order**; all matching rules apply, and for a duplicate key the **last matching rule wins**. This is stated verbatim in Vercel's Next.js headers docs ("If two headers match the same path and set the same header key, the last header key will override the first") — `next.config.js` headers compile to the same deployment routes as `vercel.json` headers.
- Caveat: the `vercel.json` reference itself never states same-key precedence verbatim. Confidence is high, not absolute.
- Confirmed the bug being fixed is real, live: `curl -sI https://coke-recap.vercel.app/assets/models/cocacola-bottle.glb` today returns `cache-control: public, max-age=31536000, immutable` (and same for the m4a).

**Required follow-up (one command, on the polish-pass-10 preview deployment):**
```
curl -sI https://<preview>.vercel.app/assets/models/cocacola-bottle.glb | grep -i cache-control
```
Expected: `public, max-age=3600` — note Vercel's proxy **consumes `stale-while-revalidate` and strips it from the client response** (docs: "Vercel's proxy consumes stale-while-revalidate for all requests. After processing it, the CDN does not include it in the final HTTP response"). Do not misread the stripped SWR directive as the override failing; the failure signature is `max-age=31536000, immutable`.

### H2. Already-poisoned browser caches — the fix only protects future visitors
Every visitor who loaded the site before this deploy holds the GLB/m4a in browser cache with `immutable, max-age=31536000`; their browser will not revalidate for up to a year, and no header change can reach them. The commit message ("unhashed models/audio no longer cached immutable for a year") is true only for fresh caches. If model/audio **bytes ever change at the same URL**, returning visitors get the stale asset silently.
**Mitigation when that day comes (not now):** rename the file (`coca-cola-diorama-v2.glb`) and update `src/scene/coca-cola-diorama.tsx:51`, `src/scene/recap/coke-bottle.tsx:11`, `src/ui/music-toggle.tsx:11`, and the two `index.html:23-24` preloads. No action in this diff; recording so the failure mode isn't forgotten.

## Medium

### M1. Loader tidbit wraps on phones → bottle/percent jump every 2.8 s
`src/ui/scene-loader.tsx:88-93`. Tidbit 1 (46 chars) at `text-[0.5rem]` + `tracking-[0.45em]` ≈ 0.45em letter-spacing on 8px type → roughly 400-420px rendered width: wraps to 2 lines on 320-414px viewports. Tidbit 2 (29 chars) stays on 1 line. The loader is a centered flex column, so cycling between 1-line and 2-line tidbits changes column height and re-centers — the bottle and percent shift ~7px every 2.8 s, precisely in the slow-4G mobile scenario the feature targets (and the scenario the 0.003 CLS score was measured without).
**Minimal fix — reserve a fixed two-line slot and center the text:**
```tsx
<p
  key={tidbit}
  className="coke-fade-in font-body text-[0.5rem] uppercase tracking-[0.45em] text-cream/25 select-none h-8 px-6 text-center"
>
```
(`h-8` pins the slot height whether the line wraps or not; `text-center px-6` keeps wrapped lines tidy. Verify h-8 covers two lines with the inherited line-height — bump to h-10 if not.)

### M2. 3 always-on point lights are not gated by the low-end path — acceptable, documented tradeoff
`src/scene/view-accent-lights.tsx:50-65`. Always-mounted point light count goes 3 → 6 (street lamps + accents); in forward rendering every lit fragment evaluates all point lights even at intensity 0, scene-wide — the per-fragment light loop roughly doubles. `PerformanceMonitor`/`perfFactor` drops SSAO/Bloom below 0.5 (`scene-root.tsx:56`) but never touches lights. Reactive gating would unmount lights → shader recompile churn on every perf oscillation, which is worse — always-mounted is the right call. Two notes:
- The comment's "constant light count avoids a mid-session shader recompile" invariant is already broken elsewhere: `recap-dispenser.tsx:104,121-122` conditionally mounts 2 point lights when the recap starts (pre-existing one-time recompile). The accent lights don't make that worse.
- If low-end frame times regress in the field, the YAGNI-compatible escape hatch is a **one-time mount decision** (initial device heuristic before first render — no mid-session recompile), not reactive `perfFactor` gating. No change requested now.

## Low

### L1. Stale tab title if the canvas dies mid-chapter
`src/ui/chapter-overlay.tsx:27-30`. `WebglFallbackBoundary` (`webgl-fallback.tsx`) unmounts ChapterOverlay on failure and sets no title of its own — the tab keeps "Tools — Coke-Recap …" over the fallback page. Edge case (boundary trips mid-session, not just at mount). One-line fix, safe across view changes (cleanup + re-set happen in the same commit, no intermediate paint):
```tsx
useEffect(() => {
  const base = 'Coke-Recap — Tarang Jammalamadaka';
  document.title = isMachine ? base : `${LABELS[view as ChapterId]} — ${base}`;
  return () => { document.title = base; };
}, [view, isMachine]);
```

### L2. Pre-start deep link shows the chapter title behind the start gate
Deep-linking `/#tools` sets the tab title to "Tools — …" while the gate is still up. Consistent with where Press Start lands, so: fine, no action — noting it was checked.

## Checked and clean (per review brief)

- **Hooks order, view-accent-lights:** all five hooks unconditional, no early return, `useFrame` last but unconditional — no order hazard.
- **Recap forcing / tearing:** `recap-context.tsx:52` resets `phase → 'idle'` whenever `view !== 'machine'`, so `phase !== 'idle'` implies `view === 'machine'` outside a 1-frame transient; in that transient the forcing correctly keeps accents off. r3f's `useFrame` updates its callback ref every render, so the closure always sees the latest `active`/`reduced` — no stale-closure tearing.
- **Reduced-motion snap writes every frame:** 3 scalar assignments/frame; three.js re-uploads light uniforms each frame regardless. Waste is negligible — leave it (matches camera-rig snap semantics).
- **ViewId import direction:** `navigation-context.tsx` imports only react + experience-context — no cycle.
- **Interval deps `[reduced, hidden]`:** `hidden` is monotonic false→true; flip clears the interval via cleanup and the guard prevents re-arm. `reduced` flips restart the 2.8 s cadence from the current tidbit — intended.
- **Typographic apostrophe in TIDBITS:** Unicode `’` inside a single-quoted TS string — no parse risk (tsc clean confirms).
- **`key={tidbit}` + `coke-fade-in`:** keyframe exists (`src/styles/globals.css:34-40`); remount replays the fade. Tidbits sit inside `role="progressbar"` whose children are presentational to AT — garnish not announced, acceptable.
- **Title effect placement:** correctly BEFORE the `if (!started) return null` early return — hook order stable when `started` flips. Bonus: child effects run before parent effects, so the title is set before NavigationProvider's `pushState` — history entries snapshot the correct title, supporting the "distinct history entries" claim.
- **Rewrites vs headers:** filesystem serve wins before the SPA rewrite; headers match the request path — confirmed live via curl against production.

## Positive observations

- Always-mounted lights with damped intensity is the correct pattern for nav-frequency changes (vs. mount/unmount recompile churn each chapter switch).
- The "role" accent comment documents WHY the position is street-side (interior light swallowed by the building shell) — exactly the kind of comment that prevents a future "fix" regressing it.
- `e.metaKey/ctrlKey/altKey`-style discipline carried over: the title effect lives in ChapterOverlay specifically to avoid a section-registry → NavigationProvider circular import, and says so.
- The vercel.json change targets a real, confirmed-in-production bug (curl shows GLB/m4a served `immutable` for a year today).

## Recommended actions (priority order)

1. **M1** — fixed-height tidbit slot in `scene-loader.tsx` (one-class change; do before PR).
2. **H1** — after preview deploy, curl the .glb and confirm `max-age=3600` (expect SWR stripped by the proxy — that is success, not failure).
3. **L1** — title cleanup in `chapter-overlay.tsx` (one line; cheap insurance).
4. **H2** — no code change; remember to rename, not overwrite, if a GLB/m4a ever changes.

## Metrics

- LOC: +114 / -0 across 5 files
- Type check: clean (per upstream verification)
- Lint/tests: not run here (review-only; no test files in diff scope)

## Unresolved questions

1. Vercel's `vercel.json` reference never states same-key header precedence verbatim (Next.js docs do, same routing layer). H1's curl check on the preview closes this definitively.
2. Does `h-8` cover two wrapped tidbit lines at the inherited line-height of `text-[0.5rem]`? Verify visually at 320px; bump to `h-10` if clipped.
