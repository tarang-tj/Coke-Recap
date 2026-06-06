// nebula.vert.glsl
// Pass-through vertex shader for the nebula icosahedron.
// Outputs world-space position, view-space position, and normal
// to the fragment shader for rim/edge softening and neural noise.

varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition  = viewMatrix * worldPosition;

  vWorldPos = worldPosition.xyz;
  vViewPos  = viewPosition.xyz;
  vNormal   = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * viewPosition;
}
