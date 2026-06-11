import { useState } from 'react';
import { Edges } from '@react-three/drei';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { usePanelCollapsed } from './experience-context';

// Shared invisible interaction proxy for diegetic analytics exhibits.
// Pattern mirrors vending-hotspot.tsx: a transparent boxGeometry for cheap
// raycasting (exhibit meshes are raycast-nulled for perf — leave that).
//
// Hover → pointer cursor + gold Edges outline (conditional render, no
// material mutation, no always-on cost).
// Click → toggles focus mode (panelCollapsedStore.toggle) — the camera rig
// responds to the collapsed state.
//
// Mount this ONLY when the owning view is active; callers gate with
// `if (view !== 'role') return null` etc. (zero off-view raycast cost).

export interface ExhibitHotspotProps {
  /** Size of the invisible proxy box in world units [w, h, d]. */
  size: [number, number, number];
  /** World-space centre of the proxy box in the exhibit group's local space. */
  position: [number, number, number];
  /** Optional accessible label (not rendered visually per spec). */
  label?: string;
}

export function ExhibitHotspot({ size, position, label }: ExhibitHotspotProps) {
  const [hovered, setHovered] = useState(false);
  const [, toggle] = usePanelCollapsed();

  // drei utility — writes document.body.style.cursor cleanly.
  useCursor(hovered);

  return (
    <mesh
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-label={label}
    >
      <boxGeometry args={size} />
      {/* Invisible fill — raycasts but never drawn over the exhibit geometry. */}
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.FrontSide}
      />
      {/* Gold edge highlight — conditional render, zero cost when not hovered. */}
      {hovered && (
        <Edges
          color="#FFD86B"
          lineWidth={2}
          threshold={1}
        />
      )}
    </mesh>
  );
}
