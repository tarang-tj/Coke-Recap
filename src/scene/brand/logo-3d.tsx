import { useRef, useMemo, type RefObject } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Coca-Cola logo extruded into a glossy 3-D mesh.
// Loads the official SVG from /brand/coca-cola-logo.svg via SVGLoader (suspends).
// All paths are merged into a single BufferGeometry so the scene draws the
// entire logotype in one draw call.  The material is meshPhysicalMaterial so
// Bloom and scene Environment reflections give it a premium chrome finish.

// Logo is auto-scaled so it spans TARGET_WIDTH world units along X.
const TARGET_WIDTH = 3.5;

// Extrude settings — depth in SVG units (~600 wide viewBox).
// Small bevel gives a crisp chrome edge that catches bloom nicely.
const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 8,
  bevelEnabled: true,
  bevelThickness: 1.0,
  bevelSize: 0.7,
  bevelSegments: 2,
  curveSegments: 12,
};

export interface Logo3DProps {
  /** Mesh color. Default '#FFFEF6' — glossy off-white for a classic white-on-red look. */
  color?: string;
  /** Multiplied on top of the auto-fit scale. Default 1. */
  scale?: number;
  /** World-space position for the wrapping group. */
  position?: [number, number, number];
  /** Euler rotation (radians) for the wrapping group. */
  rotation?: [number, number, number];
  /**
   * Optional ref to the MeshPhysicalMaterial so a parent act can animate
   * opacity / emissiveIntensity imperatively (matches the pattern used in other acts).
   * If omitted, an internal ref is used.
   */
  materialRef?: RefObject<THREE.MeshPhysicalMaterial | null>;
}

export function Logo3D({
  color = '#FFFEF6',
  scale = 1,
  position,
  rotation,
  materialRef,
}: Logo3DProps) {
  // Fallback ref when caller does not supply one
  const internalMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const matRef = materialRef ?? internalMatRef;

  // SVGLoader suspends; the ancestor <Suspense fallback={null}> in scene-root.tsx handles it
  const data = useLoader(SVGLoader, '/brand/coca-cola-logo.svg');

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  const { geometry, autoFitScale } = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];

    for (const path of data.paths) {
      // createShapes handles winding-rule holes (e.g. counters inside letters)
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length === 0) continue;

      const geo = new THREE.ExtrudeGeometry(shapes, EXTRUDE_SETTINGS);
      geos.push(geo);
    }

    if (geos.length === 0) {
      // Defensive fallback — should never happen with a valid SVG
      return { geometry: new THREE.BoxGeometry(1, 0.3, 0.1), autoFitScale: 1 };
    }

    const merged = mergeGeometries(geos, false);

    // Individual geometries are no longer needed after merge
    for (const g of geos) g.dispose();

    if (!merged) {
      return { geometry: new THREE.BoxGeometry(1, 0.3, 0.1), autoFitScale: 1 };
    }

    // Record bounding box width BEFORE centering so the scale factor is correct
    merged.computeBoundingBox();
    const bbox = merged.boundingBox!;
    const bboxWidth = bbox.max.x - bbox.min.x;

    // Center at origin
    merged.center();

    // SVG Y-axis is downward; flip Y so the script reads right-side up in 3-D.
    // Flipping through the origin preserves centering.
    merged.scale(1, -1, 1);

    const uniformScale = bboxWidth > 0 ? TARGET_WIDTH / bboxWidth : 1;
    return { geometry: merged, autoFitScale: uniformScale };
  }, [data]);

  // Combined scale: auto-fit to TARGET_WIDTH, then caller's multiplier
  const finalScale = autoFitScale * scale;

  return (
    <group scale={finalScale} position={position} rotation={rotation}>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshPhysicalMaterial
          ref={matRef}
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.15}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  );
}
