import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";

interface CarDef {
  id: number;
  color: string;
  route: { x: number; z: number }[];
  baseSpeed: number;
  phaseOffset: number;
}

const CAR_COLORS = [
  "#5a4a3a", "#7a6a5a", "#6b5b4b", "#4a3a2a",
  "#8a7a6a", "#6a5040", "#5a5040", "#706050",
  "#806848", "#5a4a40",
];

const YIELD_RADIUS = 16;
const PULL_OVER_DIST = 3.0;

function generateCarRoutes(): CarDef[] {
  const routes: CarDef[] = [];
  const baseRoutes: { x: number; z: number }[][] = [
    // Main E-W — westbound lane
    [{ x: -44, z: 0.9 }, { x: 0, z: 0.9 }, { x: 44, z: 0.9 }],
    // Main E-W — eastbound lane
    [{ x: 44, z: -0.9 }, { x: 0, z: -0.9 }, { x: -44, z: -0.9 }],
    // North road — eastbound
    [{ x: -44, z: -18 + 0.9 }, { x: 0, z: -18 + 0.9 }, { x: 44, z: -18 + 0.9 }],
    // North road — westbound
    [{ x: 44, z: -18 - 0.9 }, { x: 0, z: -18 - 0.9 }, { x: -44, z: -18 - 0.9 }],
    // South road — eastbound
    [{ x: -44, z: 18 + 0.9 }, { x: 0, z: 18 + 0.9 }, { x: 44, z: 18 + 0.9 }],
    // South road — westbound
    [{ x: 44, z: 18 - 0.9 }, { x: 0, z: 18 - 0.9 }, { x: -44, z: 18 - 0.9 }],
    // N-S at JA — southbound
    [{ x: -20 + 0.9, z: -22 }, { x: -20 + 0.9, z: 0 }, { x: -20 + 0.9, z: 22 }],
    // N-S at JC — northbound
    [{ x: 20 - 0.9, z: 22 }, { x: 20 - 0.9, z: 0 }, { x: 20 - 0.9, z: -22 }],
    // N-S at JB — southbound
    [{ x: 0.9, z: -22 }, { x: 0.9, z: 0 }, { x: 0.9, z: 22 }],
    // Diagonal N0→JA
    [{ x: -30, z: -10 + 0.7 }, { x: -20, z: 0 }],
    // Diagonal S4→Hospital
    [{ x: 32, z: 10 - 0.7 }, { x: 40, z: 0 }],
  ];

  for (let i = 0; i < 14; i++) {
    const routePath = baseRoutes[i % baseRoutes.length];
    routes.push({
      id: i,
      color: CAR_COLORS[i % CAR_COLORS.length],
      route: routePath,
      baseSpeed: 0.015 + Math.random() * 0.015,
      phaseOffset: Math.random(),
    });
  }
  return routes;
}

function CivilianCar({ car }: { car: CarDef }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(car.phaseOffset);
  const yieldOffsetRef = useRef(0);
  const wasYieldingRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const ambPos = useSimulationStore.getState().ambulance.position;
    const corridorActive = useSimulationStore.getState().corridorActive;

    // Advance along route
    progressRef.current += car.baseSpeed * delta;
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

    // Travel direction
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    // Perpendicular unit (90° clockwise)
    const perpX = segLen > 0 ? -dz / segLen : 0;
    const perpZ = segLen > 0 ? dx / segLen : 0;

    // Distance to ambulance
    const distX = px - ambPos.x;
    const distZ = pz - ambPos.z;
    const dist = Math.sqrt(distX * distX + distZ * distZ);

    const isYielding = corridorActive && dist < YIELD_RADIUS;

    if (isYielding) {
      // Progressive pull-over: closer ambulance → more offset
      const proximity = 1 - dist / YIELD_RADIUS; // 0..1, 1=closest
      const targetOffset = PULL_OVER_DIST * Math.min(1, proximity * 2);
      yieldOffsetRef.current +=
        (targetOffset - yieldOffsetRef.current) * Math.min(1, delta * 5);
      // Progressive slowdown — closer = slower
      const slowFactor = Math.max(0.02, Math.pow(dist / YIELD_RADIUS, 1.5));
      progressRef.current -= car.baseSpeed * delta * (1 - slowFactor);
      if (progressRef.current < 0) progressRef.current += 1;
      wasYieldingRef.current = true;
    } else if (wasYieldingRef.current) {
      // Resume: smoothly return to lane
      yieldOffsetRef.current *= Math.max(0, 1 - delta * 2.5);
      if (yieldOffsetRef.current < 0.05) {
        yieldOffsetRef.current = 0;
        wasYieldingRef.current = false;
      }
    }

    const off = yieldOffsetRef.current;
    groupRef.current.position.x = px + perpX * off;
    groupRef.current.position.z = pz + perpZ * off;
    groupRef.current.position.y = 0.2;

    const angle = Math.atan2(dx, dz);
    groupRef.current.rotation.y = angle;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.3, 1.2]} />
        <meshStandardMaterial color={car.color} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, -0.05]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.7]} />
        <meshStandardMaterial color={car.color} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, -0.42]}>
        <boxGeometry args={[0.5, 0.15, 0.04]} />
        <meshStandardMaterial
          color="#6a8a9a"
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>
      {[
        [-0.35, 0.05, -0.35],
        [0.35, 0.05, -0.35],
        [-0.35, 0.05, 0.35],
        [0.35, 0.05, 0.35],
      ].map(([x, y, z], i) => (
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
