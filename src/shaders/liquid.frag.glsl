// liquid.frag.glsl
// Coke-red viscous backdrop. Layered cheap-fbm + caustic bands + radial
// vignette. uReducedMotion freezes time. Color shifts subtly with scroll.

precision highp float;

varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform float uTime;
uniform float uReducedMotion;
uniform float uActT;          // global scroll 0..1
uniform vec3  uColorBright;
uniform vec3  uColorDeep;
uniform vec3  uColorAmber;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  vec4 a = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), f.z);
  vec2 b = mix(a.xy, a.zw, f.y);
  return mix(b.x, b.y, f.x);
}

float fbm(vec3 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise3(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  float t = uTime * mix(0.15, 0.02, uReducedMotion);

  // Drifting noise field in world space — no UV seams on the sphere.
  vec3 q = vWorldPos * 0.18 + vec3(0.0, t * 0.6, t * 0.4);
  float n = pow(fbm(q), 1.4);

  // Vertical caustic band.
  float caustic = 0.5 + 0.5 * sin(vWorldPos.y * 2.4 + t * 1.2 + n * 3.0);
  caustic = smoothstep(0.65, 1.0, caustic);

  // Depth ramp via view-space distance: closer = brighter.
  float depth = clamp(length(vViewPos) / 12.0, 0.0, 1.0);

  vec3 col = mix(uColorBright, uColorDeep, depth);
  col = mix(col, uColorAmber, caustic * 0.18);
  col += vec3(0.08, 0.02, 0.0) * n;

  // Subtle radial vignette using depth.
  col *= 1.0 - 0.25 * depth;

  // Scroll-driven warm/cool nudges.
  float warm = smoothstep(0.82, 1.0, uActT);
  float cool = smoothstep(0.55, 0.82, uActT) * (1.0 - smoothstep(0.82, 1.0, uActT));
  col += warm * vec3(0.12, 0.04, 0.0);
  col -= cool * vec3(0.04, 0.02, 0.02);

  gl_FragColor = vec4(col, 1.0);
}
