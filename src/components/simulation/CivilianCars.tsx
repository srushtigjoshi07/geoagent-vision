import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CarDef {
  id: number;
  color: string;
  route: { x: number; z: number }[];
  speed: number;
  phaseOffset: number;
}

const CAR_COLORS = ["#5a4a3a", "#7a6a5a", "#6b5b4b", "#4a3a2a", "#8a7a6a", "#6a5040", "#5a5040"];

function generateCarRoutes(): CarDef[] {
  const routes: CarDef[] = [];
  const baseRoutes: { x: number; z: number }[][] = [
    // Main E-W
    [{ x: -44, z: 0 }, { x: 0, z: 0 }, { x: 44, z: 0 }],
    [{ x: 44, z: 0 }, { x: 0, z: 0 }, { x: -44, z: 0 }],
    // North road
    [{ x: -44, z: -18 }, { x: 0, z: -18 }, { x: 44, z: -18 }],
    [{ x: 44, z: -18 }, { x: 0, z: -18 }, { x: -44, z: -18 }],
    // South road
    [{ x: -44, z: 18 }, { x: 0, z: 18 }, { x: 44, z: 18 }],
    // N-S at JA
    [{ x: -20, z: -22 }, { x: -20, z: 0 }, { x: -20, z: 22 }],
    // N-S at JC
    [{ x: 20, z: -22 }, { x: 20, z: 0 }, { x: 20, z: 22 }],
  ];

  for (let i = 0; i < 12; i++) {
    const routePath = baseRoutes[i % baseRoutes.length];
    routes.push({
      id: i,
      color: CAR_COLORS[i % CAR_COLORS.length],
      route: routePath,
      speed: 0.02 + Math.random() * 0.015,
      phaseOffset: Math.random(),
    });
  }
  return routes;
}

function CivilianCar({ car }: { car: CarDef }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(car.phaseOffset);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    progressRef.current += car.speed * delta;
    if (progressRef.current > 1) progressRef.current -= 1;

    const route = car.route;
    const totalSegs = route.length - 1;
    const rawIdx = progressRef.current * totalSegs;
    const segIdx = Math.min(Math.floor(rawIdx), totalSegs - 1);
    const t = rawIdx - segIdx;

    const from = route[segIdx];
    const to = route[Math.min(segIdx + 1, route.length - 1)];

    const px = from.x + (to.x - from.x) * t;
    const pz = from.z + (to.z - from.z) * t;

    groupRef.current.position.x = px;
    groupRef.current.position.z = pz;
    groupRef.current.position.y = 0.2;

    const angle = Math.atan2(to.x - from.x, to.z - from.z);
    groupRef.current.rotation.y = angle;
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.3, 1.2]} />
        <meshStandardMaterial color={car.color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.35, -0.05]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.7]} />
        <meshStandardMaterial color={car.color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.35, -0.42]}>
        <boxGeometry args={[0.5, 0.15, 0.04]} />
        <meshStandardMaterial color="#6a8a9a" roughness={0.1} metalness={0.5} transparent opacity={0.5} />
      </mesh>
      {/* Wheels */}
      {[[-0.35, 0.05, -0.35], [0.35, 0.05, -0.35], [-0.35, 0.05, 0.35], [0.35, 0.05, 0.35]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function CivilianCars() {
  const cars = useMemo(() => generateCarRoutes(), []);

  return (
    <group>
      {cars.map((car) => (
        <CivilianCar key={car.id} car={car} />
      ))}
    </group>
  );
}
