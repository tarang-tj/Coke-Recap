/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

// R3F v9 + React 19: importing the package for side-effects registers
// its JSX intrinsic element augmentation. Without this, TypeScript does
// not know about <mesh>, <bufferAttribute>, etc. inside JSX.
import '@react-three/fiber';

declare module '*.glsl?raw' {
  const src: string;
  export default src;
}

declare module '*.vert.glsl?raw' {
  const src: string;
  export default src;
}

declare module '*.frag.glsl?raw' {
  const src: string;
  export default src;
}
