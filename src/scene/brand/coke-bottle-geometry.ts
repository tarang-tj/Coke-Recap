import * as THREE from 'three';

/**
 * Classic Coca-Cola contour-bottle profile — 1915 hobble-skirt patented silhouette.
 *
 * Phase B (bottle-authenticity): ~70 profile points for smoother lathe curvature.
 *   Height ≈ 1.55 units
 *   Belly peak radius ≈ 0.355 at y ≈ 0.44  (moved up for correct proportion)
 *   Waist pinch r ≈ 0.205 at y ≈ 0.62
 *   Shoulder bulge r ≈ 0.33 at y ≈ 0.80
 *   Neck soft S-curve → collar swell at y ≈ 1.34
 */
export function buildContourProfile(): THREE.Vector2[] {
  // [radius, y] — ~70 points for smooth lathe with no visible facets at close range
  const raw: [number, number][] = [
    // --- Base foot ring (slight outward flare) ---
    [0.000, 0.000], // lathe axis center bottom
    [0.245, 0.000], // foot edge
    [0.258, 0.008], // foot ring bevel start
    [0.265, 0.018], // foot ring bevel mid
    [0.268, 0.030], // foot ring top
    [0.262, 0.042], // base transition
    [0.257, 0.055], // base to lower body

    // --- Lower hobble-skirt belly rise ---
    [0.258, 0.075],
    [0.264, 0.100],
    [0.275, 0.128],
    [0.288, 0.158],
    [0.300, 0.188],
    [0.313, 0.218],
    [0.325, 0.248],
    [0.336, 0.278],
    [0.344, 0.308],
    [0.350, 0.336],

    // --- Belly peak (max radius) moved up to y ≈ 0.44 ---
    [0.354, 0.360],
    [0.355, 0.390], // belly peak rise
    [0.355, 0.420], // belly peak — max radius
    [0.354, 0.440], // sustained belly
    [0.352, 0.458],
    [0.349, 0.475],

    // --- Upper belly tapering toward waist ---
    [0.344, 0.492],
    [0.336, 0.510],
    [0.324, 0.528],
    [0.310, 0.547],
    [0.293, 0.565],
    [0.274, 0.580],

    // --- Waist pinch (most dramatic narrowing) ---
    [0.248, 0.594],
    [0.228, 0.608],
    [0.210, 0.622], // waist pinch — tightest
    [0.205, 0.630], // waist minimum
    [0.208, 0.638],
    [0.215, 0.647],

    // --- Shoulder — S-curve re-expansion above waist (6 intermediate samples) ---
    [0.228, 0.660],
    [0.245, 0.673],
    [0.262, 0.686],
    [0.280, 0.700],
    [0.298, 0.715],
    [0.314, 0.728],
    [0.325, 0.742],
    [0.330, 0.757], // shoulder bulge
    [0.332, 0.770], // shoulder peak
    [0.330, 0.782],
    [0.322, 0.795],
    [0.308, 0.808],

    // --- Neck upper shoulder taper ---
    [0.290, 0.820],
    [0.268, 0.835],
    [0.243, 0.852],
    [0.215, 0.872],
    [0.188, 0.896],
    [0.165, 0.925],
    [0.148, 0.958],
    [0.138, 0.992],

    // --- Straight neck cylinder ---
    [0.130, 1.030],
    [0.127, 1.070],
    [0.125, 1.110],
    [0.124, 1.155],
    [0.124, 1.198],

    // --- Slight neck swell before collar ---
    [0.127, 1.238],
    [0.134, 1.272],
    [0.143, 1.302],
    [0.152, 1.325], // collar start

    // --- Neck collar swell (y ≈ 1.34, r=0.165) ---
    [0.160, 1.340],
    [0.165, 1.350], // collar swell peak

    // --- Cap seating taper ---
    [0.162, 1.380],
    [0.158, 1.415],
    [0.155, 1.450],
    [0.152, 1.490],
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
 * Phase B: segments bumped from 64 → 96 for smoother surface revolution at close range.
 * Rib y range stays approximately y=0.06 → 0.54; rib bulge ~0.013.
 */
export function buildBottleGeometrySet(segments = 96): BottleGeometrySet {
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
