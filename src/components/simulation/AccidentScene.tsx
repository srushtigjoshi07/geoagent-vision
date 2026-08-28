import { useRef, useMemo } from "react";
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
      {/* Damaged roof (tilted) */}
      <mesh position={[0.05, 0.42, -0.05]} rotation={[0.15, 0, 0.1]} castShadow>
        <boxGeometry args={[0.55, 0.15, 0.6]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.8} />
      </mesh>
      {/* Broken glass */}
      <mesh position={[0, 0.35, -0.62]}>
        <boxGeometry args={[0.4, 0.12, 0.03]} />
        <meshStandardMaterial color="#8ab" transparent opacity={0.3} roughness={0.1} />
      </mesh>
    </group>
  );
}

function WarningMarker() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.position.y = 4 + Math.sin(timeRef.current * 2) * 0.3;
    }
    if (ringRef.current) {
      const s = 1 + Math.sin(timeRef.current * 3) * 0.3;
      ringRef.current.scale.set(s, s, 1);
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.5 + Math.sin(timeRef.current * 3) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {/* Exclamation triangle */}
      <mesh>
        <coneGeometry args={[0.6, 1, 3]} />
        <meshStandardMaterial
          color="#cc8822"
          emissive="#cc8822"
          emissiveIntensity={1}
        />
      </mesh>
      {/* Warning ring */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
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
      {/* Point light */}
      <pointLight color="#ff4400" intensity={5} distance={15} decay={2} />
    </group>
  );
}

export function AccidentScene() {
  const accident = useSimulationStore((s) => s.accident);
  const phase = useSimulationStore((s) => s.phase);

  if (!accident.active) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Crashed cars at junction B */}
      <CrashedCar position={[0.5, 0.05, 0.3]} rotation={0.3} />
      <CrashedCar position={[-0.3, 0.05, -0.5]} rotation={-0.4} />
      <CrashedCar position={[1.5, 0.05, -0.2]} rotation={0.1} />

      {/* Warning marker above */}
      {(phase === "accident" || phase === "traffic" || phase === "detecting") && (
        <WarningMarker />
      )}

      {/* Congestion cars (traffic buildup) */}
      {(phase === "traffic" || phase === "detecting" || phase === "analyzing" || phase === "rerouting") && (
        <>
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
        </>
      )}
    </group>
  );
}
