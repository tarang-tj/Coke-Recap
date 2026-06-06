import { Bubbles } from './bubbles';

// FluidEnvironment — background is the CSS radial-gradient red world;
// canvas is transparent (alpha:true). Bubbles provide carbonation feel
// and bloom via postprocessing.

export function FluidEnvironment() {
  return <Bubbles />;
}
