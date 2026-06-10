# Lighthouse — polish-pass-8 (vite preview, production bundle)

Run: npx lighthouse, headless Chrome, 2026-06-09.

## Desktop preset
| Category | Score |
|---|---|
| Performance | **78** |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |

FCP 0.6 s · LCP 2.9 s · TBT 180 ms · CLS 0.001

## Mobile (default: slow-4G + 4× CPU throttle)
| Category | Score |
|---|---|
| Performance | 34 |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |

FCP 3.2 s · LCP 17.4 s · TBT 9,920 ms · CLS 0.003 · SI 6.3 s

## Read

- The three quality categories are perfect on both form factors — the a11y,
  meta, and hardening passes show up directly here.
- Mobile perf is the intrinsic cost of a 1304-mesh WebGL diorama on simulated
  slow 4G: ~1.8 MB of models + 227 KB gz three.js, then meshopt decode + scene
  build under 4× CPU throttle. The honest loader (FCP 3.2 s, CLS ≈ 0) covers
  the wait.
- Only flagged opportunity: `unused-javascript` 161 KiB — three.js's
  monolithic surface inside the vendor chunk; not actionable without fragile
  custom tree-shaking. Accepted.
- "agentic-browsing" 67 (experimental category) — not chased.

## Unresolved questions

- None. Re-measure if a future pass adds heavy assets.
