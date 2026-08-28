import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";

// 3D Ambulance model (AMB-01) — white body with red cross, flashing lights
export function Ambulance() {
  const { position, angle, flashingLights, speed } = useSimulationStore((s) => s.ambulance);
  const ambAccident = useSimulationStore((s) => s.ambulanceAccident);
  const groupRef = useRef<THREE.Group>(null);
  const lightRef1 = useRef<THREE.Mesh>(null);
  const lightRef2 = useRef<THREE.Mesh>(null);
  const indicatorRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smoothly move to target position
    groupRef.current.position.x += (position.x - groupRef.current.position.x) * 0.08;
    groupRef.current.position.z += (position.z - groupRef.current.position.z) * 0.08;
    groupRef.current.position.y = 0.35;

    // Smooth rotation
    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    groupRef.current.quaternion.slerp(targetQuat, 0.08);

    // Flash lights
    timeRef.current += delta;
    if (flashingLights && lightRef1.current && lightRef2.current) {
      const flash = Math.sin(timeRef.current * 8) > 0;
      const mat1 = lightRef1.current.material as THREE.MeshStandardMaterial;
      const mat2 = lightRef2.current.material as THREE.MeshStandardMaterial;
      mat1.emissiveIntensity = flash ? 3 : 0.2;
      mat2.emissiveIntensity = flash ? 0.2 : 3;
    }
  });

  // Emergency light glow
  const lightColor = "#dd2222";

  return (
    <group ref={groupRef} position={[position.x, 0.35, position.z]} rotation={[0, angle, 0]}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 2.4]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Cab (front) */}
      <mesh position={[0, 0.6, -1.1]} castShadow>
        <boxGeometry args={[1.1, 0.5, 0.8]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.7, -1.5]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.05]} />
        <meshStandardMaterial color="#6a8a9a" roughness={0.1} metalness={0.6} transparent opacity={0.6} />
      </mesh>
      {/* Rear compartment */}
      <mesh position={[0, 0.55, 0.4]} castShadow>
        <boxGeometry args={[1.3, 1.1, 1.6]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Red cross (right side) */}
      <mesh position={[0.66, 0.6, 0.4]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      <mesh position={[0.66, 0.6, 0.4]}>
        <boxGeometry args={[0.02, 0.15, 0.5]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* Red cross (left side) */}
      <mesh position={[-0.66, 0.6, 0.4]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      <mesh position={[-0.66, 0.6, 0.4]}>
        <boxGeometry args={[0.02, 0.15, 0.5]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* Red cross (roof — visible from isometric camera) */}
      <mesh position={[0, 1.16, 0.4]}
        rotation={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.55]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} emissive="#cc2222" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.16, 0.4]}>
        <boxGeometry args={[0.55, 0.02, 0.08]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} emissive="#cc2222" emissiveIntensity={0.3} />
      </mesh>
      {/* Red cross (front) */}
      <mesh position={[0, 0.6, -1.51]}>
        <boxGeometry args={[0.06, 0.35, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, -1.51]}>
        <boxGeometry args={[0.35, 0.06, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
      {/* Red cross (rear) */}
      <mesh position={[0, 0.6, 1.21]}>
        <boxGeometry args={[0.06, 0.35, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 1.21]}>
        <boxGeometry args={[0.35, 0.06, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
      {/* Red stripe */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.22, 0.12, 2.42]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* Roof lights bar */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.0, 0.1, 0.5]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Flashing light 1 (red) */}
      <mesh ref={lightRef1} position={[0.35, 1.25, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.3]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={2}
        />
      </mesh>
      {/* Flashing light 2 (blue-ish for contrast) */}
      <mesh ref={lightRef2} position={[-0.35, 1.25, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.3]} />
        <meshStandardMaterial
          color="#2244cc"
          emissive="#2244cc"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Wheels */}
      {[
        [-0.55, 0.12, -0.8],
        [0.55, 0.12, -0.8],
        [-0.55, 0.12, 0.7],
        [0.55, 0.12, 0.7],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
      ))}
      {/* "AMB-01" text: simple box label */}
      <mesh position={[0, 0.85, 1.21]}>
        <boxGeometry args={[0.8, 0.2, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} />
      </mesh>
      {/* Emergency point light */}
      {flashingLights && (
        <>
          <pointLight position={[0, 1.5, 0]} color="#dd3333" intensity={4} distance={12} decay={2} />
          <pointLight position={[0, 1.5, 0]} color="#3344dd" intensity={2} distance={8} decay={2} />
        </>
      )}
      {/* Ambulance accident indicator — pulsing orange ring above vehicle */}
      {ambAccident && (
        <group position={[0, 2.5, 0]}>
          <mesh ref={indicatorRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.3, 24]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={2}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 1.2]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.15, 1.2]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#ff4400" intensity={5} distance={10} decay={2} />
        </group>
      )}
    </group>
  );
}
