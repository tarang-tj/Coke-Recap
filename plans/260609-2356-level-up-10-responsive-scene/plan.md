# Level-up 10: the scene answers the chapter

**Status:** ✅ complete — PR #14 open, CI green (26 s), cache header VERIFIED on
the Vercel preview (`max-age=3600, stale-while-revalidate=86400` on the GLB;
prod still serves the old `immutable` until merge) · **Branch:** `polish-pass-10`

⚠️ Durable note: caches poisoned by the old immutable header can't be reached —
any future in-place GLB/m4a content change must RENAME the file.

## Shipped

1. **View-accent lighting** (`src/scene/view-accent-lights.tsx`) — the diorama
   reacts to the chapter being read: pharmacy storefront warms in Role, the
   vending corner rims in Tools, a far pool of light pulls the eye down the
   corridor in Agent. Damped fades (snap under reduced motion); lights always
   mounted (constant light count = no mid-session shader recompile). Role
   accent tuned street-side after the first placement was swallowed inside
   the building shell — caught by eyeball probe, not checks.
2. **Loader tidbits** — three historical lines cycle during the longest dead
   moment (slow-4G mobile spends 10 s+ on the loader); static under reduced
   motion.
3. **Per-chapter document.title** — distinct tab titles + history entries
   (lives in chapter-overlay; the section registry can't be imported into the
   provider without a cycle).
4. **Cache-header fix** (`vercel.json`) — the blanket `/assets/* immutable`
   year-long header also covered the UNHASHED GLBs/audio: returning visitors
   could hold stale models for a year after a swap. Models/audio now
   `max-age=3600, stale-while-revalidate=86400` (later rules override for
   their paths); Vite's hashed bundles stay immutable.

## Verification

27/27 prod-preview checks (new: tab title on deep link). Accent probes
eyeballed per view (/tmp shots; role accent re-placed after probe). Reviewer
pass before PR.
