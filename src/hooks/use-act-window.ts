import { ACT_WINDOWS, type ActId } from '../data/act-windows';

// Pure helpers — no hooks. Acts call these from inside useFrame with the
// current scroll progress, since they read the scroll ref directly there.
//
// Why pure functions instead of React hooks: useFrame runs many times per
// second; we don't want any React reconciliation in that loop.

export function getActWindow(id: ActId, globalT: number) {
  const [start, end] = ACT_WINDOWS[id];
  const span = end - start;
  const raw = (globalT - start) / span;
  const localT = Math.min(1, Math.max(0, raw));
  const active = globalT >= start && globalT <= end;
  return { active, localT, globalT, raw };
}

// 3rd-order smoothstep for soft entry/exit ramps inside an act.
export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

// Visibility envelope for fading an act in/out at its edges.
// Pure trapezoid: ramps up in the first `edge` of localT, holds at 1,
// ramps down in the last `edge`. Default edge = 0.15 of the act window.
export function actEnvelope(localT: number, edge = 0.15) {
  if (!Number.isFinite(localT)) return 0;
  if (localT <= 0 || localT >= 1) return 0;
  if (localT < edge) return smoothstep(localT / edge);
  if (localT > 1 - edge) return smoothstep((1 - localT) / edge);
  return 1;
}
