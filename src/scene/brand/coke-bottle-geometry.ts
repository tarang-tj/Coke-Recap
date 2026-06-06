import * as THREE from 'three';

/**
 * Classic Coca-Cola contour-bottle profile — 1915 hobble-skirt patented silhouette.
 *
 * Target ratios (Earl R. Dean patent US D77,834):
 *   Height ≈ 1.55 units
 *   Max belly radius ≈ 0.36  →  H:diameter ≈ 4.2:1  (was 3.4:1, too wide)
 *   Waist radius ≈ 0.21 at y ≈ 0.62  (more pronounced pinch)
 *   Shoulder radius ≈ 0.32 at y ≈ 0.82  (fuller above waist)
 *   Neck smooth S-curve down to ≈ 0.13 at y ≈ 1.0
 *   Base flare at y 0.0 → 0.08 for the foot ring
 */
export function buildContourProfile(): THREE.Vector2[] {
  // [radius, y] in local units — 35+ points for smooth cubic-feel curvature
  const raw: [number, number][] = [
    // --- Base foot ring (slight outward flare) ---
    [0.00, 0.000], // center bottom (lathe axis)
    [0.26, 0.000], // foot edge
    [0.27, 0.010], // foot ring bevel start
    [0.265, 0.030], // foot ring top
    [0.255, 0.060], // base transition

    // --- Lower hobble-skirt belly rise ---
    [0.26, 0.100],
    [0.28, 0.150],
    [0.30, 0.200],
    [0.325, 0.260],
    [0.345, 0.310],

    // --- Belly peak (max radius) ---
    [0.360, 0.370], // belly peak — slimmer than before
    [0.360, 0.420], // sustained belly
    [0.355, 0.470],

    // --- Upper belly tapering toward waist ---
    [0.340, 0.510],
    [0.310, 0.550],
    [0.270, 0.585],

    // --- Waist pinch (most dramatic narrowing) ---
    [0.225, 0.615], // waist pinch
    [0.210, 0.630], // waist minimum
    [0.218, 0.645],

    // --- Shoulder — re-expands above the waist ---
    [0.255, 0.680],
    [0.295, 0.715],
    [0.320, 0.745], // shoulder bulge
    [0.325, 0.770], // shoulder peak
    [0.315, 0.795],
    [0.290, 0.820],

    // --- Neck upper shoulder taper ---
    [0.255, 0.845],
    [0.210, 0.875],
    [0.170, 0.910],
    [0.145, 0.950],
    [0.130, 0.995],

    // --- Straight neck cylinder ---
    [0.125, 1.040],
    [0.123, 1.090],
    [0.122, 1.140],
    [0.124, 1.190],

    // --- Slight neck swell before collar ---
    [0.130, 1.240],
    [0.140, 1.280],
    [0.150, 1.310], // neck collar

    // --- Neck top taper to cap seating ---
    [0.155, 1.350],
    [0.160, 1.390],
    [0.163, 1.430],
    [0.165, 1.470],
    [0.162, 1.510],
    [0.150, 1.550], // bottle top rim
  ];
  return raw.map(([r, y]) => new THREE.Vector2(r, y));
}

export interface BottleGeometrySet {
  body: THREE.LatheGeometry;
  flutes: THREE.BufferGeometry;
}

/**
 * Builds the main lathe body plus subtle vertical ribbing geometry.
 *
 * The flutes are 10 thin lathe-like curved wedge meshes placed radially around
 * the lower hobble-skirt band (y 0.05 → 0.56). Each rib bulges outward by
 * ~0.012 units — subtle vertical ribbing, not chunky box-stamps.
 */
export function buildBottleGeometrySet(segments = 64): BottleGeometrySet {
  const body = new THREE.LatheGeometry(buildContourProfile(), segments);

  // --- Subtle vertical ribs (10 thin lathe-slices around the lower body) ---
  const fluteCount = 10;
  const ribWidth = 0.015; // angular half-width in radians
  const ribBulge = 0.013; // outward radial protrusion beyond body surface
  const ribYMin = 0.06;
  const ribYMax = 0.54;
  const ribSamples = 18; // vertical resolution per rib

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // Sample the body profile to get radius at each rib y position
  const profile = buildContourProfile();

  function profileRadiusAt(y: number): number {
    // Linear interpolation along the profile points
    for (let i = 1; i < profile.length; i++) {
      const p0 = profile[i - 1];
      const p1 = profile[i];
      if (y >= p0.y && y <= p1.y) {
        const t = (y - p0.y) / (p1.y - p0.y + 1e-9);
        return p0.x + (p1.x - p0.x) * t;
      }
    }
    return profile[profile.length - 1].x;
  }

  for (let fi = 0; fi < fluteCount; fi++) {
    const centerAngle = (fi / fluteCount) * Math.PI * 2;

    // Build a quad strip for each rib (3 angular columns × ribSamples rows)
    const angularSteps = [-ribWidth, 0, ribWidth];
    const heights: number[] = [];
    for (let s = 0; s <= ribSamples; s++) {
      heights.push(ribYMin + (s / ribSamples) * (ribYMax - ribYMin));
    }

    // We'll build triangle quads: for each pair of adjacent rows, for each
    // pair of adjacent angular columns
    const cols = angularSteps.length; // 3
    const rows = heights.length;      // ribSamples + 1

    // Pre-compute all vertex positions
    const verts: [number, number, number][] = [];
    for (let r = 0; r < rows; r++) {
      const y = heights[r];
      const bodyR = profileRadiusAt(y);
      for (let c = 0; c < cols; c++) {
        const angle = centerAngle + angularSteps[c];
        // Center column bulges out, edges taper back to body surface
        const bulgeFactor = 1.0 - Math.abs(angularSteps[c]) / ribWidth; // 0 at edges, 1 at center
        const r3d = bodyR + ribBulge * bulgeFactor;
        verts.push([
          Math.cos(angle) * r3d,
          y,
          Math.sin(angle) * r3d,
        ]);
      }
    }

    // Emit quads (2 triangles per quad cell)
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i00 = r * cols + c;
        const i10 = (r + 1) * cols + c;
        const i01 = r * cols + c + 1;
        const i11 = (r + 1) * cols + c + 1;

        const [x00, y00, z00] = verts[i00];
        const [x10, y10, z10] = verts[i10];
        const [x01, y01, z01] = verts[i01];
        const [x11, y11, z11] = verts[i11];

        // Triangle 1: 00, 10, 01
        positions.push(x00, y00, z00, x10, y10, z10, x01, y01, z01);
        // Triangle 2: 10, 11, 01
        positions.push(x10, y10, z10, x11, y11, z11, x01, y01, z01);

        // Basic normals pointing outward (approximate, computeVertexNormals refines)
        for (let n = 0; n < 6; n++) {
          const ang = centerAngle;
          normals.push(Math.cos(ang), 0, Math.sin(ang));
        }
        // Basic UVs
        uvs.push(0, 0, 0, 1, 1, 0);
        uvs.push(0, 1, 1, 1, 1, 0);
      }
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.computeVertexNormals(); // recompute for accuracy

  return { body, flutes: merged };
}
