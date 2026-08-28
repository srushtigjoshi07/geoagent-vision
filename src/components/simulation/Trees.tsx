import { useMemo } from "react";
import * as THREE from "three";

// Simple procedural trees
function Tree({ position }: { position: [number, number, number] }) {
  const trunkH = 1.2 + Math.random() * 0.6;
  const canopyR = 1.0 + Math.random() * 0.5;
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, trunkH, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, trunkH + canopyR * 0.7, 0]} castShadow>
        <sphereGeometry args={[canopyR, 8, 8]} />
        <meshStandardMaterial
          color={Math.random() > 0.5 ? "#3a5a2a" : "#4a6a3a"}
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}

// Streetlight
function Streetlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 5, 6]} />
        <meshStandardMaterial color="#5a5040" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 5.1, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.3]} />
        <meshStandardMaterial color="#6a6050" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Light bulb glow */}
      <mesh position={[0, 4.95, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#c4a265"
          emissive="#c4a265"
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Point light */}
      <pointLight
        position={[0, 4.8, 0]}
        color="#c4a265"
        intensity={3}
        distance={10}
        decay={2}
      />
    </group>
  );
}

// Road signs
function RoadSign({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 3, 4]} />
        <meshStandardMaterial color="#5a5040" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#4a6a3a" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function CityTrees() {
  const trees = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Along north road
    for (let x = -36; x <= 36; x += 8) {
      positions.push([x, 0, -22]);
      if (x % 16 === 0) positions.push([x, 0, -14]);
    }
    // Along south road
    for (let x = -36; x <= 36; x += 8) {
      positions.push([x, 0, 22]);
      if (x % 16 === 0) positions.push([x, 0, 14]);
    }
    return positions;
  }, []);

  const lights = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Along main corridor
    for (let x = -36; x <= 36; x += 10) {
      positions.push([x, 0, -3]);
      positions.push([x, 0, 3]);
    }
    // Along N-S roads
    for (const jx of [-20, 0, 20]) {
      for (let z = -20; z <= 20; z += 10) {
        positions.push([jx - 3, 0, z]);
        positions.push([jx + 3, 0, z]);
      }
    }
    return positions;
  }, []);

  const signs = useMemo(() => [
    [-40, 0, -2.5] as [number, number, number],
    [-20, 0, -2.5] as [number, number, number],
    [20, 0, -2.5] as [number, number, number],
    [40, 0, -2.5] as [number, number, number],
    [-30, 0, 2.5] as [number, number, number],
    [0, 0, -20.5] as [number, number, number],
    [20, 0, 20.5] as [number, number, number],
  ], []);

  return (
    <group>
      {trees.map((pos, i) => (
        <Tree key={`tree-${i}`} position={pos} />
      ))}
      {lights.map((pos, i) => (
        <Streetlight key={`light-${i}`} position={pos} />
      ))}
      {signs.map((pos, i) => (
        <RoadSign key={`sign-${i}`} position={pos} label="" />
      ))}
    </group>
  );
}
