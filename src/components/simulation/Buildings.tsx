import { useMemo } from "react";
import * as THREE from "three";

// Generate city buildings placed around the road grid
// Roads run along X=-40..40 (z=0) and at z=±18, plus z connectors

interface BuildingDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

function generateBuildings(): BuildingDef[] {
  const buildings: BuildingDef[] = [];

  // Helper: add a block of buildings
  const block = (
    cx: number, cz: number,
    count: number, spacing: number,
    minH: number, maxH: number,
    palette: string[]
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + cx * 0.1;
      const r = 4 + Math.abs(cz * 0.2) + (i % 3) * 2;
      const bx = cx + Math.cos(angle) * r * 0.5;
      const bz = cz + Math.sin(angle) * spacing * 0.6;
      const bw = 3 + (i % 3) * 1.5;
      const bd = 3 + ((i + 1) % 3) * 1.5;
      const bh = minH + Math.random() * (maxH - minH);
      buildings.push({
        x: bx, z: bz, w: bw, d: bd, h: bh,
        color: palette[i % palette.length],
      });
    }
  };

  // NW quadrant buildings
  block(-30, -10, 6, 4, 4, 16, ["#5a4a3a", "#6b5b4b", "#4a3a2a"]);
  block(-15, -10, 5, 4, 3, 12, ["#7a6a5a", "#5a4a3a", "#8a7a6a"]);
  block(-35, -5, 4, 3, 5, 10, ["#6a5a4a", "#5a4a3a", "#4a3a2a"]);
  block(-25, -15, 5, 4, 6, 20, ["#5a4a3a", "#6b5b4b", "#3a2a1a"]);

  // NE quadrant
  block(15, -10, 6, 4, 4, 18, ["#5a4a3a", "#6b5b4b", "#4a3a2a"]);
  block(30, -10, 5, 4, 5, 14, ["#7a6a5a", "#5a4a3a", "#8a7a6a"]);
  block(25, -15, 4, 3, 3, 10, ["#6a5a4a", "#5a4a3a"]);
  block(10, -15, 5, 4, 7, 22, ["#4a3a2a", "#5a4a3a", "#3a2a1a"]);

  // SW quadrant
  block(-30, 10, 6, 4, 4, 14, ["#6a5a4a", "#5a4a3a", "#7a6a5a"]);
  block(-15, 10, 5, 4, 3, 11, ["#5a4a3a", "#4a3a2a", "#8a7a6a"]);
  block(-35, 5, 4, 3, 5, 12, ["#5a4a3a", "#6b5b4b"]);
  block(-25, 15, 5, 4, 6, 16, ["#4a3a2a", "#5a4a3a", "#3a2a1a"]);

  // SE quadrant
  block(15, 10, 6, 4, 4, 16, ["#6a5a4a", "#5a4a3a", "#7a6a5a"]);
  block(30, 10, 5, 4, 5, 13, ["#5a4a3a", "#4a3a2a"]);
  block(25, 15, 4, 3, 3, 8, ["#7a6a5a", "#5a4a3a"]);
  block(10, 15, 5, 4, 8, 24, ["#3a2a1a", "#5a4a3a", "#4a3a2a"]);

  // Extra mid blocks
  block(-5, -12, 4, 3, 4, 9, ["#6a5a4a", "#5a4a3a"]);
  block(-5, 12, 4, 3, 4, 8, ["#5a4a3a", "#6a5a4a"]);
  block(5, -12, 4, 3, 5, 10, ["#4a3a2a", "#5a4a3a"]);
  block(5, 12, 4, 3, 4, 9, ["#6a5a4a", "#4a3a2a"]);

  // Tall landmark buildings
  buildings.push(
    { x: -38, z: -16, w: 5, d: 5, h: 28, color: "#3a2a1a" },
    { x: -12, z: -20, w: 6, d: 6, h: 32, color: "#2a1a0a" },
    { x: 12, z: -20, w: 6, d: 6, h: 30, color: "#3a2a1a" },
    { x: 38, z: -16, w: 5, d: 5, h: 26, color: "#2a1a0a" },
    { x: -38, z: 16, w: 5, d: 5, h: 24, color: "#3a2a1a" },
    { x: -12, z: 20, w: 6, d: 6, h: 28, color: "#2a1a0a" },
    { x: 12, z: 20, w: 6, d: 6, h: 22, color: "#3a2a1a" },
    { x: 38, z: 16, w: 5, d: 5, h: 20, color: "#2a1a0a" },
  );

  return buildings;
}

// Memoized building mesh instances
export function CityBuildings() {
  const buildings = useMemo(() => generateBuildings(), []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2, b.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.85}
            metalness={0.05}
          />
          {/* Window detail: small emissive strips */}
          {b.h > 8 && (
            <group position={[0, 0, 0]}>
              {Array.from({ length: Math.floor(b.h / 4) }, (_, j) => (
                <mesh
                  key={j}
                  position={[b.w / 2 + 0.01, -b.h / 2 + 3 + j * 4, 0]}
                  rotation={[0, 0, 0]}
                >
                  <planeGeometry args={[0.15, 1.2]} />
                  <meshStandardMaterial
                    color="#c4a265"
                    emissive="#c4a265"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              ))}
            </group>
          )}
        </mesh>
      ))}
    </group>
  );
}
