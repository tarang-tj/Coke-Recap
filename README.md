# Coke-Recap

**An interactive 3-D recap of a Global Human Insights internship at The Coca-Cola Company — served ice cold.**

🥤 **Live:** [coke-recap.vercel.app](https://coke-recap.vercel.app)

![Coke-Recap — 1886 Five Points, Atlanta at golden hour](./public/og-image.jpg)

---

## The concept

Instead of a slide deck, the internship recap is a miniature diorama of **Five Points, Atlanta, 1886** — the Jacobs' Pharmacy block where Coca-Cola was first served on May 8, 1886 — rendered at golden hour and explored entirely in the browser.

Press **START** and the camera settles into a wide establishing shot. From there, two ways in:

1. **The vending machine.** Click the glowing Coca-Cola machine: a 5-cent coin drops, a contour bottle is dispensed and floats up to a hero pose, and a story-mode panel pages through the whole internship — intro → The Role → The Stack → The Agent → Takeaways.
2. **The chapter pills.** Click a pill (or press keys **1–4**) and the camera flies to a vantage point in the diorama for that chapter.

Drag to look around. **ESC** returns home.

### A note on content

> Zero specifics by design — no internal data, metrics, or campaign names. Tools are named with generic blurbs, and the AI agent is described conceptually.

## Built with

| Layer | Tech |
|---|---|
| Framework | [Vite](https://vitejs.dev) + [React 19](https://react.dev) + TypeScript |
| 3-D | [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) v9, [drei](https://docs.pmnd.rs/drei), [three](https://threejs.org) 0.184 |
| Post-processing | [@react-three/postprocessing](https://docs.pmnd.rs/react-postprocessing) — SSAO, bloom, vignette, film grain |
| UI | Tailwind CSS 3.4 |
| Animation math | [maath](https://github.com/pmndrs/maath) |
| Assets | Diorama + bottle GLBs, meshopt-compressed (~76% smaller) |
| Hosting | Vercel |

## Engineering highlights

- **One Canvas, zero scrolling.** A single persistent `<Canvas>` and a view-state machine drive all navigation — the camera rig owns every movement, and scene transitions are exclusive so views never fight.
- **Runtime decal re-tint.** The baked Coca-Cola script decals are re-tinted on a canvas at runtime to get crisp white lettering without shipping duplicate textures.
- **Capture-phase key routing.** Keyboard input is routed at the capture phase so the recap panel and diorama navigation never steal each other's keys.
- **Respectful by default.** `prefers-reduced-motion` support, a WebGL fallback, and lazy-loaded music — nothing autoplays at you.
- **Shippable polish.** PWA manifest, SEO/OG tags, and a production-bundle screenshot verification loop (Puppeteer) that catches visual regressions before deploy.

## Period details

The diorama keeps it honest to 1886: **ICE COLD** signage on the block, and the machine takes a nickel — the price of a Coca-Cola from 1886 all the way to 1959.

## Running locally

```bash
npm install
npm run dev       # local dev server
npm run preview   # serve the production output locally
```

## Music

*"Fig Leaf Times Two"* by **Kevin MacLeod** ([incompetech.com](https://incompetech.com))
Licensed under [Creative Commons: By Attribution 3.0](https://creativecommons.org/licenses/by/3.0/)

## Author

**Tarang Jammalamadaka**
[GitHub](https://github.com/tarang-tj) · [LinkedIn](https://linkedin.com/in/tarang-jammalamadaka)
