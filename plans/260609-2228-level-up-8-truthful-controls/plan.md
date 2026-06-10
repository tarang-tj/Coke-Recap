# Level-up 8: truthful controls, shareable URLs, guarded main

**Status:** ✅ complete — PR #11 open against `main` (stack #8-#10 merged by user),
first CI run GREEN (24 s), Vercel preview deployed · **Branch:** `polish-pass-8`
**Mode:** ultracode

26/26 prod-preview checks (motion-freeze pixel proof: on=143,287 / off=0
differing pixels). Reviewer: no blockers; both lows fixed. Lighthouse recorded.
Mid-pass ENOSPC outage (disk 100% full) — resolved by user clearing npm caches.

## Why (the ultrathink cut)

Passes 6-7 completed content, reach, life, and announcements. What's left is
integrity and infrastructure, not polish:

1. **The Motion toggle does nothing.** `useReducedMotion` reads only
   `matchMedia`; the toggle writes a body attribute nobody consumes. A shipped
   control that lies outranks any new feature.
2. **Zero URL state.** No deep links; back button exits the site. A portfolio
   gets *shared* — `#tools` should land in the chapter, and back should work.
3. **No CI.** Nothing guards main; all verification so far is my local loop.
4. **Never measured.** Record real Lighthouse numbers; fix only cheap findings.

## Phases

1. **fix(motion): store-backed `useReducedMotion`** — module store
   (override: system|reduced|full, persisted throw-safe) merged with
   `matchMedia` via `useSyncExternalStore`; toggle drives the store. Every
   existing consumer (camera, smoke, vehicles, lamps, dispenser, beacon, gate)
   works through the hook unchanged. Drop the dead `data-motion` dataset
   (no consumers). VERIFY: with Motion: Off, two frames 2.5 s apart are
   pixel-identical modulo film grain (thresholded diff count); motion-on
   frames differ in thousands of pixels.
2. **feat(nav): deep links + back button** — `view ↔ location.hash` in
   NavigationProvider: init from hash, pushState per view change, popstate →
   setView. `#role|#tools|#agent|#takeaways`. Recap NOT hash-linked (YAGNI).
3. **feat(recap): touch swipe paging** — pointerType==='touch' window
   listeners while open; horizontal-dominant 60 px threshold.
4. **fix(mobile): safe-area insets** — pills `bottom-[max(...)]`, mobile
   toggles `top-[max(...)]` so nothing sits under the home indicator/notch.
5. **fix(audio): pause music on hidden tab**, resume on return.
6. **chore(ci): GitHub Actions** — npm ci + production bundle on PR/push to
   main. First green run verified via `gh`.
7. **chore(deps): remove dead `lenis`**, fix stale comments.
8. **measure: Lighthouse** (mobile + desktop presets) against the preview;
   record scores in a report; act only on cheap findings.
9. **Verify + review** — suite + new checks (motion-freeze pixel diff, deep
   link, back button, swipe), screenshots eyeballed, one adversarial reviewer
   on the diff (focused: the motion store touches every animation consumer).

## Out of scope

Cinematic camera arcs (glide is good; arc-vs-geometry risk), recap deep-link,
analytics (needs user opt-in), service worker, custom domain.
