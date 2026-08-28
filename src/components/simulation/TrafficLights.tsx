import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface TrafficLightProps {
  position: [number, number, number];
  rotation?: number;
  cycleOffset?: number;
}

function TrafficLight({ position, rotation = 0, cycleOffset = 0 }: TrafficLightProps) {
  const [color, setColor] = useState<"red" | "yellow" | "green">("green");
  const timer = useRef(cycleOffset);

  useFrame((_, delta) => {
    timer.current += delta;
    const cycle = timer.current % 8;
    if (cycle < 4) setColor("green");
    else if (cycle < 5) setColor("yellow");
    else setColor("red");
  });

  const redOn = color === "red";
  const yellowOn = color === "yellow";
  const greenOn = color === "green";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.6, 6]} />
        <meshStandardMaterial color="#4a4030" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Housing */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[0.4, 1.2, 0.3]} />
        <meshStandardMaterial color="#3a3530" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Red */}
      <mesh position={[0, 4.2, 0.16]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#aa3333"
          emissive={redOn ? "#ff4444" : "#000000"}
          emissiveIntensity={redOn ? 2 : 0}
        />
      </mesh>
      {/* Yellow */}
      <mesh position={[0, 3.8, 0.16]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#aa8833"
          emissive={yellowOn ? "#ffaa00" : "#000000"}
          emissiveIntensity={yellowOn ? 2 : 0}
        />
      </mesh>
      {/* Green */}
      <mesh position={[0, 3.4, 0.16]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#33aa33"
          emissive={greenOn ? "#44ff44" : "#000000"}
          emissiveIntensity={greenOn ? 2 : 0}
        />
      </mesh>
      {/* Light from active color */}
      {redOn && <pointLight position={[0, 4.2, 0.5]} color="#ff3333" intensity={0.5} distance={4} />}
      {yellowOn && <pointLight position={[0, 3.8, 0.5]} color="#ffaa00" intensity={0.5} distance={4} />}
      {greenOn && <pointLight position={[0, 3.4, 0.5]} color="#33ff33" intensity={0.5} distance={4} />}
    </group>
  );
}

export function CityTrafficLights() {
  const lights: [number, number, number, number][] = [
    [-20, 0, -3, 0],
    [0, 0, -3, 0],
    [20, 0, -3, 0],
    [-20, 0, 3, Math.PI],
    [0, 0, 3, Math.PI],
    [20, 0, 3, Math.PI],
    [-23, 0, -18, Math.PI / 2],
    [23, 0, -18, -Math.PI / 2],
    [-23, 0, 18, Math.PI / 2],
    [23, 0, 18, -Math.PI / 2],
  ];

  return (
    <group>
      {lights.map(([x, y, z, rot], i) => (
        <TrafficLight
          key={i}
          position={[x, y, z]}
          rotation={rot}
          cycleOffset={i * 2}
        />
      ))}
    </group>
  );
}
