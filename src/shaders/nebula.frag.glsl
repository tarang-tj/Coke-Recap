// nebula.frag.glsl
// Additive-blend emissive core for the agent act icosahedron.
// 3-stop palette: cream → caramel → coke-red.
// High-frequency "neural" noise layered over low-frequency fbm.
// Strong rim via pow(1 - dot(viewDir, normal), 2) for bloom edge glow.

precision highp float;

varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform float uTime;
uniform float uReducedMotion;
uniform float uLocalT;

// ── noise helpers ─────────────────────────────────────────────────────────────

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

// Low-frequency fbm — 5 octaves for richer large-scale structure
float fbmLow(vec3 p) {
  float v   = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v   += amp * noise3(p);
    p   *= 2.02;
    amp *= 0.5;
  }
  return v;
}

// High-frequency "neural" fbm — tight scale, 3 octaves
float fbmHigh(vec3 p) {
  float v   = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    v   += amp * noise3(p);
    p   *= 3.8;
    amp *= 0.45;
  }
  return v;
}

void main() {
  float t = uTime * mix(0.28, 0.0, uReducedMotion);

  // Low-freq base: large colour blobs drifting upward
  vec3 q = vWorldPos * 0.65 + vec3(0.0, t, t * 0.3);
  float nLow = fbmLow(q);

  // High-freq neural crackle layered on top
  vec3 qHigh = vWorldPos * 3.2 + vec3(t * 0.7, -t * 0.4, 0.0);
  float nHigh = fbmHigh(qHigh) * 0.38;

  float n = clamp(nLow + nHigh, 0.0, 1.0);

  // 3-stop palette: cream → caramel → coke-red
  vec3 cream   = vec3(0.945, 0.914, 0.855);  // #F1E9DA
  vec3 caramel = vec3(0.627, 0.416, 0.000);  // #A06A00
  vec3 cokeRed = vec3(0.957, 0.000, 0.035);  // #F40009

  vec3 col = cream;
  col = mix(col, caramel, smoothstep(0.28, 0.60, n));
  col = mix(col, cokeRed, smoothstep(0.60, 1.00, n) * 0.72);

  // ── rim lighting ──────────────────────────────────────────────────────────
  // Center glow stays bright; rim edge flares for bloom halo effect.
  vec3  viewDir   = normalize(-vViewPos);
  float facing    = max(0.0, dot(normalize(vNormal), viewDir));
  float centerGlow = pow(facing, 1.2);
  float rimGlow   = pow(1.0 - facing, 2.0) * 1.6;
  float rim = clamp(centerGlow + rimGlow * 0.55, 0.0, 1.0);

  // ── breathing pulse ───────────────────────────────────────────────────────
  float pulse = 1.0 + mix(
    0.55 * sin(uTime * 1.6) + 0.15 * sin(uTime * 4.1),
    0.0,
    uReducedMotion
  );

  // ── Gaussian brightness peak at localT = 0.5 ─────────────────────────────
  float peak = exp(-pow((uLocalT - 0.5) * 4.0, 2.0));
  float brightness = pulse * (1.0 + peak * 0.8);

  vec3  finalCol = col * brightness;
  float alpha    = rim * (0.65 + 0.35 * n) * (0.7 + 0.3 * peak);

  gl_FragColor = vec4(finalCol, alpha);
}
