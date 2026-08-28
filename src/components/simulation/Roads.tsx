import { useMemo } from "react";
import * as THREE from "three";

// Road segments defined as start/end positions and width
interface RoadSeg {
  x1: number; z1: number;
  x2: number; z2: number;
  width: number;
}

const ROAD_WIDTH = 4.0;
const SIDEWALK_WIDTH = 1.2;

function getRoadSegments(): RoadSeg[] {
  return [
    // Main E-W corridors
    { x1: -44, z1: 0, x2: 44, z2: 0, width: ROAD_WIDTH },
    { x1: -44, z1: -18, x2: 44, z2: -18, width: ROAD_WIDTH },
    { x1: -44, z1: 18, x2: 44, z2: 18, width: ROAD_WIDTH },

    // N-S corridors at key junctions
    { x1: -20, z1: -22, x2: -20, z2: 22, width: ROAD_WIDTH },
    { x1: 0, z1: -22, x2: 0, z2: 22, width: ROAD_WIDTH },
    { x1: 20, z1: -22, x2: 20, z2: 22, width: ROAD_WIDTH },

    // Extra N-S connectors
    { x1: -40, z1: -5, x2: -40, z2: 5, width: ROAD_WIDTH },
    { x1: 40, z1: -5, x2: 40, z2: 5, width: ROAD_WIDTH },

    // Diagonal access roads
    { x1: -40, z1: 0, x2: -20, z2: 0, width: ROAD_WIDTH },
    { x1: -30, z1: -10, x2: -20, z2: -18, width: 3 },
    { x1: -30, z1: 10, x2: -20, z2: 18, width: 3 },
    { x1: 32, z1: -10, x2: 20, z2: -18, width: 3 },
    { x1: 32, z1: 10, x2: 20, z2: 18, width: 3 },
    { x1: 32, z1: -10, x2: 40, z2: 0, width: 3 },
    { x1: 32, z1: 10, x2: 40, z2: 0, width: 3 },
  ];
}

function RoadSegment({ seg }: { seg: RoadSeg }) {
  const dx = seg.x2 - seg.x1;
  const dz = seg.z2 - seg.z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const cx = (seg.x1 + seg.x2) / 2;
  const cz = (seg.z1 + seg.z2) / 2;

  return (
    <group>
      {/* Road surface */}
      <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
        <planeGeometry args={[seg.width, length]} />
        <meshStandardMaterial color="#2a2520" roughness={0.95} metalness={0} />
      </mesh>
      {/* Center line (dashed yellow) */}
      <mesh position={[cx, 0.025, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
        <planeGeometry args={[0.12, length]} />
        <meshStandardMaterial
          color="#c4a265"
          emissive="#c4a265"
          emissiveIntensity={0.15}
          roughness={0.6}
        />
      </mesh>
      {/* Sidewalk left */}
      <mesh position={[cx, 0.06, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, length + 0.5]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function CityRoads() {
  const segments = useMemo(() => getRoadSegments(), []);

  return (
    <group>
      {segments.map((seg, i) => (
        <RoadSegment key={i} seg={seg} />
      ))}
      {/* Intersection plates at key junctions */}
      {[
        [-20, 0], [0, 0], [20, 0],
        [-20, -18], [0, -18], [20, -18],
        [-20, 18], [0, 18], [20, 18],
      ].map(([x, z], i) => (
        <mesh key={`int-${i}`} position={[x, 0.015, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[ROAD_WIDTH * 0.8, 16]} />
          <meshStandardMaterial color="#2a2520" roughness={0.95} />
        </mesh>
      ))}
      {/* Ground plane */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 80]} />
        <meshStandardMaterial color="#3a3530" roughness={1} />
      </mesh>
    </group>
  );
}
