# Coke-Recap — "The Coca-Cola Machine" (vending-machine navigation rebuild)

**Branch:** `redesign/coca-cola-machine` (from `c582e94`)
**Local:** `~/dev/Coke-Recap`

## Concept
Replace vertical scrollytelling with a spatial **vending-machine hub**. PRESS START powers on a 3D
Coca-Cola vending machine. Behind the glass: 4 labeled bottles = chapters (Role, Stack, Agent,
Takeaways). Click a bottle (or 1–4 / arrow keys) → camera flies into that chapter's 3D "stage";
ESC / BACK returns to the machine. NO scroll anywhere.

## Navigation model
- `view: 'machine' | 'role' | 'tools' | 'agent' | 'takeaways'` (state machine, not scroll).
- Controls: click bottles; keys 1–4 select; ←/→ prev/next chapter; ESC/BACK → machine. Mouse parallax throughout.
- Camera-rig animates to a per-view pose (damp3). All camera motion stays in camera-rig.
- Acts gate on `view` + a damped per-act focus envelope (replaces scroll window / localT).

## View → content mapping (reuse existing 3D acts)
- machine → VendingMachine (new) + Logo3D on header. (act-cold-open logo retired into the machine.)
- role → act-role (bottle cap) + role panel
- tools → act-tools (chips) + tools panel
- agent → act-agent (core/rings) + agent panel
- takeaways → act-bottle (contour bottle) + learnings/contact panel

## Keep
Red world (skydome), bubbles (+cursor reactive), floating props, sparkles, postprocessing
(Bloom+Vignette), Logo3D, contour bottle/cap/chips/agent core, PRESS START gate, reduced motion,
mouse parallax. A ContactShadows floor UNDER the machine is OK now (grounded object).

## Remove/replace
- Scroll architecture: `use-scroll-progress`, Lenis, `useScrollRef` for scroll, `ACT_WINDOWS`/
  `getActWindow` scroll gating, the tall `<main>` of `<Section>`s, `useSectionProgress`, scroll-debug,
  HUD scroll progress bar. Page becomes a single 100vh viewport.

## Tasks
- T1: `VendingMachine` 3D component (subagent) — stylized red cabinet + glass + 4 labeled bottles,
  per-bottle hover + onSelect; presentational. API below.
- T2: Navigation foundation (controller) — `navigation-context.ts` (view + setView/next/prev/home),
  keyboard hook, app shell refactor (drop scroll, single viewport, providers, mount machine + panels),
  camera-rig view poses.
- T3: Re-gate the 4 chapter acts on `view` + damped focus envelope (controller).
- T4: DOM per-view content panels + BACK button + chapter selector HUD (subagent).
- T5: Wire bottle selection + hover + polish; verify (screenshots), build, review, merge.

## VendingMachine API (T1)
```ts
interface MachineItem { id: 'role'|'tools'|'agent'|'takeaways'; label: string; color: string; }
interface VendingMachineProps {
  items: MachineItem[];
  onSelect: (id: MachineItem['id']) => void;
  reducedMotion?: boolean; // or use the hook internally
}
```
Renders cabinet (glossy red rounded box), dark glass front (no transmission), header with room for
a logo, 4 illuminated contour bottles on a shelf each interactive (onPointerOver/onClick→onSelect),
labels under each, a dispense slot + glowing 1–4 button strip. Built from primitives + lathe bottle.

## Done criteria
No scroll; click/keys navigate; camera flies machine↔chapters; chapters reuse existing motifs;
build green; visually verified; reduced motion + no transmission preserved.
