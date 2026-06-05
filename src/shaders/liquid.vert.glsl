// liquid.vert.glsl
// Renders a back-faced sphere/box surrounding the camera. We need
// world-space and view-space position in the fragment shader to compute
// the curl-noise field and the depth ramp.

varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * worldPosition;

  vWorldPos = worldPosition.xyz;
  vViewPos = viewPosition.xyz;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * viewPosition;
}
