import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";
import { CITY_NODES } from "@/lib/cityGraph";

// Tube-based route line that avoids JSX <line> SVG collision
function GlowingRouteLine({
  nodeIds,
  color,
  height,
  width,
  animated,
}: {
  nodeIds: string[];
  color: string;
  height?: number;
  width?: number;
  animated?: boolean;
}) {
  const h = height ?? 0.5;
  const w = width ?? 0.3;

  const segments = useMemo(() => {
    const segs: { pos: [number, number, number]; rot: number; len: number }[] = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const a = CITY_NODES.find((n) => n.id === nodeIds[i]);
      const b = CITY_NODES.find((n) => n.id === nodeIds[i + 1]);
      if (!a || !b) continue;
      const mx = (a.position.x + b.position.x) / 2;
      const mz = (a.position.z + b.position.z) / 2;
      const dx = b.position.x - a.position.x;
      const dz = b.position.z - a.position.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      const rot = Math.atan2(dx, dz);
      segs.push({ pos: [mx, h, mz], rot, len });
    }
    return segs;
  }, [nodeIds, h]);

  return (
    <group>
      {segments.map((seg, i) => (
        <mesh
          key={i}
          position={seg.pos}
          rotation={[-Math.PI / 2, 0, -seg.rot]}
        >
          <planeGeometry args={[w, seg.len]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={animated ? 1.5 : 0.8}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Node dots at junction points */}
      {nodeIds.map((id) => {
        const node = CITY_NODES.find((n) => n.id === id);
        if (!node) return null;
        return (
          <mesh key={id} position={[node.position.x, h + 0.05, node.position.z]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function CityRouteLines() {
  const phase = useSimulationStore((s) => s.phase);
  const altRoutes = useSimulationStore((s) => s.altRoutes);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);

  const showPrimary = phase !== "idle" && phase !== "completed";
  const showCongested =
    phase === "accident" ||
    phase === "traffic" ||
    phase === "detecting" ||
    phase === "analyzing";
  const showAlts =
    phase === "rerouting" ||
    phase === "rerouted" ||
    phase === "enroute_alt" ||
    phase === "hospital" ||
    phase === "completed";

  return (
    <group>
      {/* Primary route (green before accident) */}
      {showPrimary && !showCongested && (
        <GlowingRouteLine
          nodeIds={["BASE", "JA", "JB", "JC", "HOSPITAL"]}
          color="#6a9a5a"
          height={0.55}
          width={0.4}
          animated
        />
      )}

      {/* Congested primary route (red) */}
      {showCongested && (
        <GlowingRouteLine
          nodeIds={["BASE", "JA", "JB", "JC", "HOSPITAL"]}
          color="#aa3333"
          height={0.55}
          width={0.4}
          animated
        />
      )}

      {/* Alternative routes */}
      {showAlts &&
        altRoutes.map((route) => {
          const isActive = route.id === activeRouteId;
          const color = route.isRecommended ? "#ccaa22" : "#667788";
          return (
            <GlowingRouteLine
              key={route.id}
              nodeIds={route.path}
              color={color}
              height={isActive ? 0.7 : 0.45}
              width={isActive ? 0.5 : 0.25}
              animated={isActive}
            />
          );
        })}
    </group>
  );
}
