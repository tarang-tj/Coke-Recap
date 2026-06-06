import * as THREE from 'three';

/**
 * Classic Coca-Cola contour-bottle profile (hobble-skirt silhouette).
 * Height ≈ 1.55 units, max radius ≈ 0.46 — roughly 3.4:1 height-to-width ratio
 * matching the iconic glass contour bottle proportions.
 */
export function buildContourProfile(): THREE.Vector2[] {
  const raw: [number, number][] = [
    [0.0, 0.0],
    [0.32, 0.0],
    [0.34, 0.01],
    [0.33, 0.04],
    [0.32, 0.08],
    [0.34, 0.12],
    [0.38, 0.17],
    [0.42, 0.23],
    [0.45, 0.29],
    [0.46, 0.36],
    [0.46, 0.43], // belly peak
    [0.45, 0.50],
    [0.42, 0.56],
    [0.36, 0.61],
    [0.28, 0.65], // waist pinch
    [0.26, 0.68],
    [0.29, 0.72],
    [0.34, 0.76],
    [0.36, 0.80], // shoulder
    [0.32, 0.84],
    [0.24, 0.88],
    [0.18, 0.93],
    [0.15, 0.98],
    [0.14, 1.03],
    [0.13, 1.08],
    [0.13, 1.13],
    [0.135, 1.18],
    [0.14, 1.23],
    [0.15, 1.28],
    [0.155, 1.33],
    [0.16, 1.38],
    [0.165, 1.43],
    [0.17, 1.48],
    [0.165, 1.52],
    [0.15, 1.55],
  ];
  return raw.map(([r, y]) => new THREE.Vector2(r, y));
}

export interface BottleGeometrySet {
  body: THREE.LatheGeometry;
  flutes: THREE.BufferGeometry;
}

export function buildBottleGeometrySet(segments = 48): BottleGeometrySet {
  const body = new THREE.LatheGeometry(buildContourProfile(), segments);

  const fluteCount = 10;
  const fluteGeo = new THREE.BoxGeometry(0.035, 0.22, 0.02);
  const positions: number[] = [];
  const baseY = 0.2;
  const baseR = 0.4;

  for (let i = 0; i < fluteCount; i++) {
    const angle = (i / fluteCount) * Math.PI * 2;
    const x = Math.cos(angle) * baseR;
    const z = Math.sin(angle) * baseR;
    const helper = new THREE.Object3D();
    helper.position.set(x, baseY, z);
    helper.rotation.set(0, -angle, 0);
    helper.updateMatrix();
    const m = helper.matrix.elements;
    const posAttr = fluteGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let v = 0; v < posAttr.count; v++) {
      const vx = posAttr.getX(v);
      const vy = posAttr.getY(v);
      const vz = posAttr.getZ(v);
      positions.push(
        m[0] * vx + m[4] * vy + m[8] * vz + m[12],
        m[1] * vx + m[5] * vy + m[9] * vz + m[13],
        m[2] * vx + m[6] * vy + m[10] * vz + m[14],
      );
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.computeVertexNormals();

  return { body, flutes: merged };
}
