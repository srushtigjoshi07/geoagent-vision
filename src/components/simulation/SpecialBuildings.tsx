import { useMemo } from "react";
import * as THREE from "three";

function EmergencyBase() {
  return (
    <group position={[-40, 0, 0]}>
      {/* Main building */}
      <mesh position={[0, 2, -4]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 5]} />
        <meshStandardMaterial color="#6a4a3a" roughness={0.8} />
      </mesh>
      {/* Garage bays */}
      <mesh position={[-2, 1.2, 1.5]} castShadow>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      <mesh position={[2, 1.2, 1.5]} castShadow>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      {/* Garage doors */}
      <mesh position={[-2, 1.0, 3.01]}>
        <boxGeometry args={[2.2, 2, 0.05]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[2, 1.0, 3.01]}>
        <boxGeometry args={[2.2, 2, 0.05]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Helipad on roof */}
      <mesh position={[0, 4.02, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#5a5a4a" roughness={0.8} />
      </mesh>
      {/* H marking */}
      <mesh position={[0, 4.04, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial color="#ccaa22" emissive="#ccaa22" emissiveIntensity={0.3} />
      </mesh>
      {/* Emergency base sign */}
      <mesh position={[0, 3.5, -1.49]}>
        <boxGeometry args={[4, 0.6, 0.05]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#cc2222"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Flag pole */}
      <mesh position={[5, 3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 6, 4]} />
        <meshStandardMaterial color="#888" metalness={0.5} />
      </mesh>
      {/* Flag */}
      <mesh position={[5.6, 5.5, 0]}>
        <boxGeometry args={[1.2, 0.6, 0.02]} />
        <meshStandardMaterial color="#cc2222" roughness={0.6} />
      </mesh>
      {/* Label: "BASE" on ground */}
      <mesh position={[0, 0.03, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 0.6]} />
        <meshStandardMaterial
          color="#c4a265"
          emissive="#c4a265"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function Hospital() {
  return (
    <group position={[40, 0, 0]}>
      {/* Main building */}
      <mesh position={[0, 3, -3]} castShadow receiveShadow>
        <boxGeometry args={[10, 6, 6]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.7} />
      </mesh>
      {/* Wing left */}
      <mesh position={[-3, 2, 2]} castShadow>
        <boxGeometry args={[5, 4, 4]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.7} />
      </mesh>
      {/* Wing right */}
      <mesh position={[3, 2, 2]} castShadow>
        <boxGeometry args={[5, 4, 4]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.7} />
      </mesh>
      {/* Red cross on front */}
      <mesh position={[0, 3, 5.01]}>
        <boxGeometry args={[0.6, 2, 0.05]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#cc2222"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 3, 5.01]}>
        <boxGeometry args={[2, 0.6, 0.05]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#cc2222"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Windows (emissive) */}
      {Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: 3 }, (_, j) => (
          <mesh key={`w-${i}-${j}`} position={[-4 + i * 1.1, 1.5 + j * 2, -6.01]}>
            <boxGeometry args={[0.7, 0.8, 0.05]} />
            <meshStandardMaterial
              color="#c4a265"
              emissive="#c4a265"
              emissiveIntensity={0.6}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))
      )}
      {/* Entrance canopy */}
      <mesh position={[0, 2.2, 5.3]} castShadow>
        <boxGeometry args={[4, 0.15, 2]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Emergency light on roof */}
      <mesh position={[0, 6.2, -3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 8]} />
        <meshStandardMaterial
          color="#cc2222"
          emissive="#cc2222"
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight position={[0, 6.5, -3]} color="#cc2222" intensity={3} distance={10} />
      {/* Label */}
      <mesh position={[0, 0.03, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.6]} />
        <meshStandardMaterial
          color="#c4a265"
          emissive="#c4a265"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

export function SpecialBuildings() {
  return (
    <group>
      <EmergencyBase />
      <Hospital />
    </group>
  );
}
