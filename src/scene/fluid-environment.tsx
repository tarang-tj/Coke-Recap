import { Bubbles } from './bubbles';

// FluidEnvironment — the expensive inverted-sphere fbm shader has been
// removed. Background color (#0A0203) comes from <color attach="background">
// in scene-root and Environment preset lighting provides depth.
// Bubbles are kept for the carbonation feel; they bloom via postprocessing.

export function FluidEnvironment() {
  return <Bubbles />;
}
