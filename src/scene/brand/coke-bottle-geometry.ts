import * as THREE from 'three';

/**
 * Classic Coca-Cola contour-bottle profile — 1915 hobble-skirt patented silhouette.
 *
 * Phase B (reference-driven rebuild):
 *   Height ≈ 1.55 units
 *   Belly peak radius ≈ 0.24 at y ≈ 0.44  (slimmed from 0.355 → H:D ~3.2:1)
 *   Waist pinch r ≈ 0.155 at y ≈ 0.62
 *   Shoulder bulge r ≈ 0.22 at y ≈ 0.80
 *   Neck taper from y=0.85 (r=0.17) → y=1.30 (r=0.10)
 *   Bottle top rim: y=1.55, r=0.10
 *   Foot ring: r=0.18 at base
 */
export function buildContourProfile(): THREE.Vector2[] {
  // [radius, y] — ~70 points for smooth lathe with no visible facets at close range
  const raw: [number, number][] = [
    // --- Base foot ring (slight outward flare) ---
    [0.000, 0.000], // lathe axis center bottom
    [0.165, 0.000], // foot edge
    [0.173, 0.008], // foot ring bevel start
    [0.178, 0.018], // foot ring bevel mid
    [0.180, 0.030], // foot ring top
    [0.176, 0.042], // base transition
    [0.172, 0.055], // base to lower body

    // --- Lower hobble-skirt belly rise ---
    [0.172, 0.075],
    [0.177, 0.100],
    [0.184, 0.128],
    [0.192, 0.158],
    [0.200, 0.188],
    [0.208, 0.218],
    [0.216, 0.248],
    [0.223, 0.278],
    [0.229, 0.308],
    [0.234, 0.336],

    // --- Belly peak (max radius ~0.24) at y ≈ 0.44 ---
    [0.237, 0.360],
    [0.239, 0.390], // belly peak rise
    [0.240, 0.420], // belly peak — max radius
    [0.239, 0.440], // sustained belly
    [0.237, 0.458],
    [0.234, 0.475],

    // --- Upper belly tapering toward waist ---
    [0.229, 0.492],
    [0.221, 0.510],
    [0.212, 0.528],
    [0.200, 0.547],
    [0.186, 0.565],
    [0.173, 0.580],

    // --- Waist pinch (most dramatic narrowing) ---
    [0.163, 0.594],
    [0.158, 0.608],
    [0.155, 0.622], // waist pinch — tightest
    [0.155, 0.630], // waist minimum
    [0.157, 0.638],
    [0.160, 0.647],

    // --- Shoulder — S-curve re-expansion above waist ---
    [0.166, 0.660],
    [0.174, 0.673],
    [0.183, 0.686],
    [0.192, 0.700],
    [0.200, 0.715],
    [0.208, 0.728],
    [0.214, 0.742],
    [0.218, 0.757], // shoulder bulge
    [0.220, 0.770], // shoulder peak
    [0.218, 0.782],
    [0.213, 0.795],
    [0.205, 0.808],

    // --- Neck upper shoulder taper ---
    [0.194, 0.820],
    [0.180, 0.835],
    [0.163, 0.852],
    [0.145, 0.872],
    [0.128, 0.896],
    [0.114, 0.925],
    [0.105, 0.958],
    [0.100, 0.992],

    // --- Straight neck cylinder ---
    [0.096, 1.030],
    [0.094, 1.070],
    [0.093, 1.110],
    [0.092, 1.155],
    [0.092, 1.198],

    // --- Slight neck swell before collar ---
    [0.094, 1.238],
    [0.099, 1.272],
    [0.104, 1.302],
    [0.108, 1.325], // collar start

    // --- Neck collar swell (y ≈ 1.34, r=0.113) ---
    [0.111, 1.340],
    [0.113, 1.350], // collar swell peak

    // --- Cap seating taper ---
    [0.111, 1.380],
    [0.108, 1.415],
    [0.106, 1.450],
    [0.104, 1.490],
    [0.102, 1.550], // bottle top rim
  ];
  return raw.map(([r, y]) => new THREE.Vector2(r, y));
}

export interface BottleGeometrySet {
  body: THREE.LatheGeometry;
  flutes: THREE.BufferGeometry;
}

/**
 * Helper: interpolate radius at any y along the profile.
 * Exported so liquid geometry can reuse it.
 */
export function profileRadiusAt(
  profile: THREE.Vector2[],
  y: number,
): number {
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

/**
 * Builds the liquid interior geometry — a lathe shape that follows the
 * bottle's inner profile from y=0.06 to y≈1.05 (roughly 75% fill),
 * inset by 0.012 units inside the glass wall.
 *
 * Returns a LatheGeometry that should be rendered with a brown cola material
 * INSIDE the glass mesh.
 */
export function buildLiquidGeometry(): THREE.LatheGeometry {
  const profile = buildContourProfile();
  const yStart = 0.06;
  const yEnd = 1.05;
  const inset = 0.012;
  const samples = 40;

  const points: THREE.Vector2[] = [];

  // Bottom cap — close the lathe at the axis
  points.push(new THREE.Vector2(0, yStart));

  for (let i = 0; i <= samples; i++) {
    const y = yStart + (i / samples) * (yEnd - yStart);
    const r = Math.max(0, profileRadiusAt(profile, y) - inset);
    points.push(new THREE.Vector2(r, y));
  }

  // Top cap — close at axis so the top face is sealed
  points.push(new THREE.Vector2(0, yEnd));

  return new THREE.LatheGeometry(points, 64);
}

/**
 * Builds the main lathe body plus subtle vertical ribbing geometry.
 *
 * Segments at 96 for smooth surface revolution.
 * Rib y range: y=0.06 → 0.54; rib bulge ~0.008 (slightly less since bottle is slimmer).
 */
export function buildBottleGeometrySet(segments = 96): BottleGeometrySet {
  const profile = buildContourProfile();
  const body = new THREE.LatheGeometry(profile, segments);

  // --- Subtle vertical ribs (10 thin lathe-slices around the lower body) ---
  const fluteCount = 10;
  const ribWidth = 0.015; // angular half-width in radians
  const ribBulge = 0.010; // outward radial protrusion (slightly less than before — slimmer bottle)
  const ribYMin = 0.06;
  const ribYMax = 0.54;
  const ribSamples = 18; // vertical resolution per rib

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let fi = 0; fi < fluteCount; fi++) {
    const centerAngle = (fi / fluteCount) * Math.PI * 2;

    const angularSteps = [-ribWidth, 0, ribWidth];
    const heights: number[] = [];
    for (let s = 0; s <= ribSamples; s++) {
      heights.push(ribYMin + (s / ribSamples) * (ribYMax - ribYMin));
    }

    const cols = angularSteps.length; // 3
    const rows = heights.length;      // ribSamples + 1

    const verts: [number, number, number][] = [];
    for (let r = 0; r < rows; r++) {
      const y = heights[r];
      const bodyR = profileRadiusAt(profile, y);
      for (let c = 0; c < cols; c++) {
        const angle = centerAngle + angularSteps[c];
        const bulgeFactor = 1.0 - Math.abs(angularSteps[c]) / ribWidth;
        const r3d = bodyR + ribBulge * bulgeFactor;
        verts.push([
          Math.cos(angle) * r3d,
          y,
          Math.sin(angle) * r3d,
        ]);
      }
    }

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

        positions.push(x00, y00, z00, x10, y10, z10, x01, y01, z01);
        positions.push(x10, y10, z10, x11, y11, z11, x01, y01, z01);

        for (let n = 0; n < 6; n++) {
          const ang = centerAngle;
          normals.push(Math.cos(ang), 0, Math.sin(ang));
        }
        uvs.push(0, 0, 0, 1, 1, 0);
        uvs.push(0, 1, 1, 1, 1, 0);
      }
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.computeVertexNormals();

  return { body, flutes: merged };
}
