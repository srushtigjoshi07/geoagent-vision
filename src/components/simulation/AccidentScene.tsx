import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";

function CrashedCar({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.35, 1.2]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.8} />
      </mesh>
      <mesh position={[0.05, 0.42, -0.05]} rotation={[0.15, 0, 0.1]} castShadow>
        <boxGeometry args={[0.55, 0.15, 0.6]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.35, -0.62]}>
        <boxGeometry args={[0.4, 0.12, 0.03]} />
        <meshStandardMaterial color="#8ab" transparent opacity={0.3} roughness={0.1} />
      </mesh>
    </group>
  );
}

function WarningMarker({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + 4 + Math.sin(timeRef.current * 2) * 0.3;
    }
    if (ringRef.current) {
      const s = 1 + Math.sin(timeRef.current * 3) * 0.3;
      ringRef.current.scale.set(s, s, 1);
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.5 + Math.sin(timeRef.current * 3) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] + 4, position[2]]}>
      <mesh>
        <coneGeometry args={[0.6, 1, 3]} />
        <meshStandardMaterial color="#cc8822" emissive="#cc8822" emissiveIntensity={1} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshStandardMaterial
          color="#ff6622"
          emissive="#ff4400"
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#ff4400" intensity={5} distance={15} decay={2} />
    </group>
  );
}

function AccidentCluster({
  position,
  showMarker,
}: {
  position: { x: number; z: number };
  showMarker: boolean;
}) {
  return (
    <group position={[position.x, 0, position.z]}>
      <CrashedCar position={[0.5, 0.05, 0.3]} rotation={0.3} />
      <CrashedCar position={[-0.3, 0.05, -0.5]} rotation={-0.4} />
      <CrashedCar position={[1.5, 0.05, -0.2]} rotation={0.1} />
      {showMarker && <WarningMarker position={[0, 0, 0]} />}
    </group>
  );
}

export function AccidentScene() {
  const activeAccidents = useSimulationStore((s) => s.activeAccidents);
  const phase = useSimulationStore((s) => s.phase);

  if (activeAccidents.length === 0) return null;

  const showMarkers =
    phase === "accident" ||
    phase === "traffic" ||
    phase === "detecting" ||
    phase === "analyzing" ||
    phase === "rerouting";

  return (
    <group>
      {activeAccidents.map((acc, i) => (
        <AccidentCluster
          key={`${acc.scenario.id}-${i}`}
          position={acc.scenario.position}
          showMarker={showMarkers}
        />
      ))}

      {/* Traffic buildup around each accident */}
      {(phase === "traffic" || phase === "detecting" || phase === "analyzing" || phase === "rerouting") &&
        activeAccidents.map((acc, i) => {
          const pos = acc.scenario.position;
          return (
            <group key={`traffic-${i}`} position={[pos.x, 0, pos.z]}>
              <mesh position={[-3, 0.2, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.2]} />
                <meshStandardMaterial color="#6a5a4a" roughness={0.8} />
              </mesh>
              <mesh position={[-5, 0.2, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.2]} />
                <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
              </mesh>
              <mesh position={[-7, 0.2, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.2]} />
                <meshStandardMaterial color="#7a6a5a" roughness={0.8} />
              </mesh>
              <mesh position={[3, 0.2, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.2]} />
                <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
              </mesh>
              <mesh position={[5, 0.2, 0]} castShadow>
                <boxGeometry args={[0.7, 0.35, 1.2]} />
                <meshStandardMaterial color="#6a5a4a" roughness={0.8} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}
