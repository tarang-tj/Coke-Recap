// liquid.frag.glsl
// Simple vertical gradient — no fbm, no noise loops.
// Coke-black at top, dark-red glow radiating from bottom-center.
// Used only if fluid-environment still mounts a mesh (currently unused).

precision mediump float;

varying vec2 vUv;

uniform float uTime;
uniform float uActT;

void main() {
  // Vertical ramp: 0 at top, 1 at bottom.
  float vert = 1.0 - vUv.y;

  // Radial glow from bottom-center.
  vec2 fromCenter = vec2(vUv.x - 0.5, vUv.y - 0.0);
  float radial = 1.0 - clamp(length(fromCenter) * 1.4, 0.0, 1.0);

  float glow = vert * radial;
  float pulse = 0.5 + 0.5 * sin(uTime * 0.4);
  glow *= 0.7 + 0.3 * pulse;

  vec3 black = vec3(0.039, 0.008, 0.012); // #0A0203
  vec3 red   = vec3(0.71, 0.012, 0.02);   // coke red

  vec3 col = mix(black, red, glow * 0.6);
  gl_FragColor = vec4(col, 1.0);
}
