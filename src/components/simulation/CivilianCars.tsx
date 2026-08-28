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
];

// Yield detection radius — cars within this distance of the ambulance yield
const YIELD_RADIUS = 14;
// How far to pull off the road (perpendicular offset)
const PULL_OVER_DIST = 2.8;

function generateCarRoutes(): CarDef[] {
  const routes: CarDef[] = [];
  const baseRoutes: { x: number; z: number }[][] = [
    // Main E-W (westbound)
    [{ x: -44, z: 0.8 }, { x: 0, z: 0.8 }, { x: 44, z: 0.8 }],
    // Main E-W (eastbound)
    [{ x: 44, z: -0.8 }, { x: 0, z: -0.8 }, { x: -44, z: -0.8 }],
    // North road (eastbound)
    [{ x: -44, z: -18 + 0.8 }, { x: 0, z: -18 + 0.8 }, { x: 44, z: -18 + 0.8 }],
    // North road (westbound)
    [{ x: 44, z: -18 - 0.8 }, { x: 0, z: -18 - 0.8 }, { x: -44, z: -18 - 0.8 }],
    // South road (eastbound)
    [{ x: -44, z: 18 + 0.8 }, { x: 0, z: 18 + 0.8 }, { x: 44, z: 18 + 0.8 }],
    // N-S at JA (southbound)
    [{ x: -20 + 0.8, z: -22 }, { x: -20 + 0.8, z: 0 }, { x: -20 + 0.8, z: 22 }],
    // N-S at JC (northbound)
    [{ x: 20 - 0.8, z: 22 }, { x: 20 - 0.8, z: 0 }, { x: 20 - 0.8, z: -22 }],
  ];

  for (let i = 0; i < 12; i++) {
    const routePath = baseRoutes[i % baseRoutes.length];
    routes.push({
      id: i,
      color: CAR_COLORS[i % CAR_COLORS.length],
      route: routePath,
      baseSpeed: 0.018 + Math.random() * 0.012,
      phaseOffset: Math.random(),
    });
  }
  return routes;
}

function CivilianCar({ car }: { car: CarDef }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(car.phaseOffset);
  // Per-car state refs (not reactive — updated every frame via useFrame)
  const yieldOffsetRef = useRef(0); // current perpendicular offset toward shoulder
  const wasYieldingRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Read ambulance state from store (non-reactive read — no re-render)
    const ambPos = useSimulationStore.getState().ambulance.position;
    const corridorActive = useSimulationStore.getState().corridorActive;

    // Advance progress along route
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

    // Travel direction (for perpendicular offset)
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    // Perpendicular unit vector (rotate travel dir 90° clockwise)
    const perpX = segLen > 0 ? -dz / segLen : 0;
    const perpZ = segLen > 0 ? dx / segLen : 0;

    // Distance from this car to the ambulance
    const distX = px - ambPos.x;
    const distZ = pz - ambPos.z;
    const dist = Math.sqrt(distX * distX + distZ * distZ);

    const isYielding = corridorActive && dist < YIELD_RADIUS;

    if (isYielding) {
      // Pull over: smoothly offset perpendicular to road and slow down
      const targetOffset = PULL_OVER_DIST;
      yieldOffsetRef.current += (targetOffset - yieldOffsetRef.current) * Math.min(1, delta * 4);
      // Slow down — the closer the ambulance, the slower
      const slowFactor = Math.max(0.05, dist / YIELD_RADIUS);
      progressRef.current -= car.baseSpeed * delta * (1 - slowFactor);
      if (progressRef.current < 0) progressRef.current += 1;
      wasYieldingRef.current = true;
    } else if (wasYieldingRef.current) {
      // Ambulance has passed — smoothly return to normal lane position
      yieldOffsetRef.current *= Math.max(0, 1 - delta * 3);
      if (yieldOffsetRef.current < 0.05) {
        yieldOffsetRef.current = 0;
        wasYieldingRef.current = false;
      }
    }

    const off = yieldOffsetRef.current;
    const finalX = px + perpX * off;
    const finalZ = pz + perpZ * off;

    groupRef.current.position.x = finalX;
    groupRef.current.position.z = finalZ;
    groupRef.current.position.y = 0.2;

    const angle = Math.atan2(dx, dz);
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
