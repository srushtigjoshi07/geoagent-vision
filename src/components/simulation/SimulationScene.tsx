import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";
import { CityBuildings } from "./Buildings";
import { CityRoads } from "./Roads";
import { CityTrees } from "./Trees";
import { CityTrafficLights } from "./TrafficLights";
import { Ambulance } from "./Ambulance";
import { CivilianCars } from "./CivilianCars";
import { AccidentScene } from "./AccidentScene";
import { CityRouteLines } from "./RouteLines";
import { SpecialBuildings } from "./SpecialBuildings";

// Tick loop: advances the simulation each frame
function TickLoop() {
  const tick = useSimulationStore((s) => s.tick);
  const phase = useSimulationStore((s) => s.phase);

  useFrame((_, delta) => {
    if (phase !== "idle" && phase !== "completed") {
      tick(delta);
    }
  });

  return null;
}

// Lighting setup — warm vintage / command-center feel
function SceneLighting() {
  return (
    <>
      {/* Ambient fill — low to keep drama */}
      <ambientLight intensity={0.25} color="#c4a265" />
      {/* Main directional (sun/street lamp) */}
      <directionalLight
        position={[30, 40, -20]}
        intensity={1.2}
        color="#e8d8c0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.001}
      />
      {/* Fill from opposite side */}
      <directionalLight position={[-20, 20, 20]} intensity={0.4} color="#a09080" />
      {/* Hemisphere sky/ground */}
      <hemisphereLight
        args={["#6a7a8a", "#3a3020", 0.3]}
      />
    </>
  );
}

export function SimulationScene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [50, 45, 50],
        fov: 40,
        near: 0.1,
        far: 200,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      style={{ background: "transparent" }}
    >
      {/* Fog for depth */}
      <fog attach="fog" args={["#1a1510", 40, 120]} />

      <SceneLighting />
      <TickLoop />

      {/* City elements */}
      <CityRoads />
      <CityBuildings />
      <SpecialBuildings />
      <CityTrees />
      <CityTrafficLights />
      <CityRouteLines />

      {/* Vehicles */}
      <Ambulance />
      <CivilianCars />
      <AccidentScene />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={15}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.3}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
