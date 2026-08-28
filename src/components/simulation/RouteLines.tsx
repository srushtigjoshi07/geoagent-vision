import { useMemo } from "react";
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
  opacity,
}: {
  nodeIds: string[];
  color: string;
  height?: number;
  width?: number;
  animated?: boolean;
  opacity?: number;
}) {
  const h = height ?? 0.5;
  const w = width ?? 0.3;
  const op = opacity ?? 0.85;

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
            emissiveIntensity={animated ? 1.2 : 0.5}
            transparent
            opacity={op}
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
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
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
    phase === "accident" || phase === "traffic" || phase === "detecting" || phase === "analyzing";
  const showAlts =
    phase === "rerouting" || phase === "rerouted" || phase === "enroute_alt" || phase === "hospital" || phase === "completed";

  return (
    <group>
      {/* Primary route — light grey before accident */}
      {showPrimary && !showCongested && (
        <GlowingRouteLine
          nodeIds={["BASE", "JA", "JB", "JC", "HOSPITAL"]}
          color="#888888"
          height={0.5}
          width={0.35}
          animated
          opacity={0.7}
        />
      )}

      {/* Congested primary route — muted red tint on grey */}
      {showCongested && (
        <GlowingRouteLine
          nodeIds={["BASE", "JA", "JB", "JC", "HOSPITAL"]}
          color="#994444"
          height={0.5}
          width={0.35}
          animated
          opacity={0.55}
        />
      )}

      {/* Alternative routes */}
      {showAlts &&
        altRoutes.map((route) => {
          const isActive = route.id === activeRouteId;
          // All alt routes are light grey; the active/selected one is darker and thicker
          const color = isActive ? "#b0b0b0" : "#6a6a6a";
          return (
            <GlowingRouteLine
              key={route.id}
              nodeIds={route.path}
              color={color}
              height={isActive ? 0.6 : 0.42}
              width={isActive ? 0.55 : 0.28}
              animated={isActive}
              opacity={isActive ? 0.9 : 0.5}
            />
          );
        })}
    </group>
  );
}
