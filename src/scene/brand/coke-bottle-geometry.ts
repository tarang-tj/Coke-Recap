import * as THREE from 'three';

/**
 * Classic Coca-Cola contour-bottle profile — 1915 hobble-skirt patented silhouette.
 *
 * Phase B (proportion fix):
 *   Height ≈ 1.55 units
 *   Belly peak radius ≈ 0.27 at y ≈ 0.62  (40% from base — fixes "elongated above half")
 *   Waist pinch r ≈ 0.215 at y ≈ 0.815
 *   Shoulder bulge r ≈ 0.225 at y ≈ 0.91
 *   Neck cylinder r ≈ 0.125 from y=1.05 → y=1.30
 *   Bottle top rim: y=1.55, r=0.115
 *   Foot ring: r=0.20 at base
 */
export function buildContourProfile(): THREE.Vector2[] {
  // [radius, y] — ~70 points for smooth lathe with no visible facets at close range
  const raw: [number, number][] = [
    // --- Base foot ring (slight outward flare) ---
    [0.000, 0.000], // lathe axis center bottom
    [0.175, 0.000], // foot edge
    [0.185, 0.010], // foot ring bevel start
    [0.195, 0.020], // foot ring bevel mid
    [0.200, 0.040], // foot ring top
    [0.198, 0.055], // base transition
    [0.215, 0.080], // base to lower body

    // --- Lower hobble-skirt belly rise ---
    [0.220, 0.120],
    [0.228, 0.150],
    [0.235, 0.180],
    [0.241, 0.210],
    [0.247, 0.245],
    [0.250, 0.280],
    [0.253, 0.315],
    [0.256, 0.350],
    [0.259, 0.385],
    [0.262, 0.420],
    [0.265, 0.455],
    [0.267, 0.485],
    [0.269, 0.510],

    // --- Belly peak (sustained wide section 0.56 → 0.72) ---
    [0.270, 0.560], // belly peak starts
    [0.270, 0.590], // rising to peak
    [0.270, 0.620], // BELLY PEAK — max radius, 40% from base
    [0.270, 0.650], // still at peak
    [0.270, 0.680], // still wide
    [0.268, 0.700], // belly starts very slightly narrowing
    [0.265, 0.720], // belly narrowing begins

    // --- Upper belly to waist ---
    [0.258, 0.740],
    [0.250, 0.760],
    [0.238, 0.780],
    [0.227, 0.795],
    [0.215, 0.815], // WAIST pinch — tightest

    // --- Shoulder bulge (S-curve re-expansion above waist) ---
    [0.218, 0.830],
    [0.222, 0.845],
    [0.226, 0.860],
    [0.229, 0.875],
    [0.231, 0.890],
    [0.225, 0.910], // SHOULDER peak
    [0.218, 0.930],
    [0.215, 0.940],

    // --- Neck taper ---
    [0.205, 0.950],
    [0.190, 0.965],
    [0.175, 0.980],
    [0.162, 0.995],
    [0.150, 1.010],
    [0.140, 1.025],
    [0.133, 1.040],
    [0.128, 1.055],

    // --- Straight neck cylinder (r ≈ 0.125) ---
    [0.126, 1.080],
    [0.125, 1.110],
    [0.125, 1.140],
    [0.125, 1.165],
    [0.125, 1.190],
    [0.125, 1.230], // mid-neck, wordmark emboss zone

    // --- Slight neck swell before collar ---
    [0.126, 1.270],
    [0.128, 1.300],
    [0.132, 1.330],

    // --- Neck collar swell ---
    [0.137, 1.360],
    [0.140, 1.390], // collar swell peak — neck ring torus sits here
    [0.137, 1.420],
    [0.133, 1.450],

    // --- Cap seating taper ---
    [0.126, 1.475],
    [0.120, 1.505],
    [0.117, 1.530],
    [0.115, 1.550], // bottle top rim
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
 * bottle's inner profile from y=0.06 to y≈0.96 (realistic fill level),
 * inset by 0.012 units inside the glass wall.
 *
 * Returns a LatheGeometry that should be rendered with a dark cola material
 * INSIDE the glass mesh.
 */
export function buildLiquidGeometry(): THREE.LatheGeometry {
  const profile = buildContourProfile();
  const yStart = 0.06;
  const yEnd = 0.96;   // Phase B: moved down from 1.05 → realistic air gap above liquid
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
 * Rib y range: y=0.06 → 0.65 (extended to cover new sustained belly section).
 */
export function buildBottleGeometrySet(segments = 96): BottleGeometrySet {
  const profile = buildContourProfile();
  const body = new THREE.LatheGeometry(profile, segments);

  // --- Subtle vertical ribs (10 thin lathe-slices around the lower body) ---
  const fluteCount = 10;
  const ribWidth = 0.015; // angular half-width in radians
  const ribBulge = 0.013; // outward radial protrusion
  const ribYMin = 0.06;
  const ribYMax = 0.65;   // Phase B: extended from 0.54 → 0.65 to cover new belly
  const ribSamples = 18;  // vertical resolution per rib

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
