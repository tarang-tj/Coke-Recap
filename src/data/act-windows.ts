// Central scroll-window table. Every act looks up its [start, end] here.
// Numbers are normalized scroll progress across the whole page (0..1).
//
// The windows intentionally overlap slightly at boundaries so cross-act
// transitions fade rather than pop.

export type ActId = 'cold-open' | 'role' | 'tools' | 'agent' | 'bottle';

export const ACT_WINDOWS: Record<ActId, [number, number]> = {
  'cold-open': [0.0, 0.18],
  role: [0.16, 0.4],
  tools: [0.38, 0.62],
  agent: [0.6, 0.84],
  bottle: [0.82, 1.0],
};

export const ACT_ORDER: ActId[] = [
  'cold-open',
  'role',
  'tools',
  'agent',
  'bottle',
];
