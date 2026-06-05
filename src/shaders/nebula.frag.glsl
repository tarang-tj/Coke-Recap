// nebula.frag.glsl
// Additive-blend emissive core for the agent act icosahedron.
// Layered fbm in warm cream/caramel/coke-red, rim-softened at edges,
// with a breathing pulse modulated by uTime.

precision highp float;

varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform float uTime;
uniform float uReducedMotion;
uniform float uLocalT;

// --- noise helpers (same pattern as liquid.frag.glsl) ---

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
  float v   = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v   += amp * noise3(p);
    p   *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  // Animate upward drift; freeze when reduced-motion is on.
  float t = uTime * mix(0.3, 0.0, uReducedMotion);

  // Sample fbm in world space to avoid UV seams.
  vec3 q = vWorldPos * 0.7 + vec3(0.0, t, 0.0);
  float n = fbm(q);

  // Palette: cream -> caramel -> faint coke-red
  vec3 cream   = vec3(0.945, 0.914, 0.855);  // #F1E9DA
  vec3 caramel = vec3(0.627, 0.416, 0.0);    // #A06A00
  vec3 cokeRed = vec3(0.957, 0.0,   0.035);  // #F40009

  vec3 col = cream;
  col = mix(col, caramel, smoothstep(0.3, 0.65, n));
  col = mix(col, cokeRed, smoothstep(0.65, 1.0, n) * 0.55);

  // Rim softening: faces pointing away from the viewer fade out.
  // dot(normalised surface normal, normalised view direction) ~ 1 at center,
  // ~ 0 at silhouette. pow sharpens the fall-off.
  vec3  viewDir = normalize(-vViewPos);
  float rimDot  = max(0.0, dot(normalize(vNormal), viewDir));
  float rim     = pow(rimDot, 1.5);

  // Breathing pulse — skip when reduced-motion is requested.
  float pulse = 1.0 + mix(0.6 * sin(uTime * 1.5), 0.0, uReducedMotion);

  // Final additive colour: rim controls opacity so edges dissolve.
  vec3 finalCol = col * pulse;
  float alpha   = rim * (0.7 + 0.3 * n);

  gl_FragColor = vec4(finalCol, alpha);
}
