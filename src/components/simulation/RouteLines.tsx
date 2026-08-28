import { useMemo } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulationStore";
import { CITY_NODES, edgeKey } from "@/lib/cityGraph";

// ── Route line segment ────────────────────────────────────────────────
function RouteSegment({
  fromId,
  toId,
  color,
  height,
  width,
  animated,
  opacity,
}: {
  fromId: string;
  toId: string;
  color: string;
  height: number;
  width: number;
  animated: boolean;
  opacity: number;
}) {
  const a = CITY_NODES.find((n) => n.id === fromId);
  const b = CITY_NODES.find((n) => n.id === toId);
  if (!a || !b) return null;

  const mx = (a.position.x + b.position.x) / 2;
  const mz = (a.position.z + b.position.z) / 2;
  const dx = b.position.x - a.position.x;
  const dz = b.position.z - a.position.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  const rot = Math.atan2(dx, dz);

  return (
    <mesh position={[mx, height, mz]} rotation={[-Math.PI / 2, 0, -rot]}>
      <planeGeometry args={[width, len]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={animated ? 1.2 : 0.4}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Blocked edge indicator (red dashed overlay) ───────────────────────
function BlockedSegment({
  fromId,
  toId,
  height,
}: {
  fromId: string;
  toId: string;
  height: number;
}) {
  const a = CITY_NODES.find((n) => n.id === fromId);
  const b = CITY_NODES.find((n) => n.id === toId);
  if (!a || !b) return null;

  const mx = (a.position.x + b.position.x) / 2;
  const mz = (a.position.z + b.position.z) / 2;
  const dx = b.position.x - a.position.x;
  const dz = b.position.z - a.position.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  const rot = Math.atan2(dx, dz);

  // X mark at the center of the blocked segment
  return (
    <group position={[mx, height + 0.1, mz]}>
      {/* Red base line */}
      <mesh rotation={[-Math.PI / 2, 0, -rot]}>
        <planeGeometry args={[0.6, len]} />
        <meshStandardMaterial
          color="#cc3333"
          emissive="#cc2222"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* X cross */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 0.15]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2222"
          emissiveIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.2, 0.15]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2222"
          emissiveIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Junction dot ──────────────────────────────────────────────────────
function JunctionDot({
  nodeId,
  color,
  height,
}: {
  nodeId: string;
  color: string;
  height: number;
}) {
  const node = CITY_NODES.find((n) => n.id === nodeId);
  if (!node) return null;
  return (
    <mesh position={[node.position.x, height + 0.05, node.position.z]}>
      <sphereGeometry args={[0.18, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

// ── Full route line (collection of segments + dots) ───────────────────
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
  height: number;
  width: number;
  animated: boolean;
  opacity: number;
}) {
  return (
    <group>
      {nodeIds.map((id, i) => {
        if (i >= nodeIds.length - 1) return null;
        return (
          <RouteSegment
            key={`${id}-${nodeIds[i + 1]}`}
            fromId={id}
            toId={nodeIds[i + 1]}
            color={color}
            height={height}
            width={width}
            animated={animated}
            opacity={opacity}
          />
        );
      })}
      {nodeIds.map((id) => (
        <JunctionDot key={id} nodeId={id} color={color} height={height} />
      ))}
    </group>
  );
}

// ── Main component ────────────────────────────────────────────────────
export function CityRouteLines() {
  const phase = useSimulationStore((s) => s.phase);
  const altRoutes = useSimulationStore((s) => s.altRoutes);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);
  const blockedEdges = useSimulationStore((s) => s.allBlockedEdges);
  const activeAccidents = useSimulationStore((s) => s.activeAccidents);

  const showPrimary = phase !== "idle" && phase !== "completed";
  const showAlts = altRoutes.length > 0;

  // Build blocked segment pairs from blocked edge keys
  const blockedPairs = useMemo(() => {
    const pairs: [string, string][] = [];
    blockedEdges.forEach((k) => {
      // Parse edge key back to node ids — check against CITY_NODES pairs
      for (const e of CITY_NODES) {
        for (const f of CITY_NODES) {
          if (e.id < f.id && edgeKey(e.id, f.id) === k) {
            pairs.push([e.id, f.id]);
          }
        }
      }
    });
    return pairs;
  }, [blockedEdges]);

  // Get accident positions for warning markers
  const accidentPositions = activeAccidents.map((a) => a.scenario.position);

  return (
    <group>
      {/* Primary route — light grey before accident */}
      {showPrimary && !showAlts && (
        <GlowingRouteLine
          nodeIds={["BASE", "JA", "JB", "JC", "HOSPITAL"]}
          color="#888888"
          height={0.5}
          width={0.35}
          animated
          opacity={0.7}
        />
      )}

      {/* Alternative routes — all visible when available */}
      {showAlts &&
        altRoutes.map((route) => {
          const isActive = route.id === activeRouteId;
          // Selected route: darker grey, thicker. Others: light grey, thin.
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

      {/* Blocked segments — red X markers */}
      {blockedPairs.map(([a, b]) => (
        <BlockedSegment key={`blocked-${a}-${b}`} fromId={a} toId={b} height={0.5} />
      ))}

      {/* Accident location markers */}
      {accidentPositions.map((pos, i) => (
        <AccidentMarker key={`acc-${i}`} position={pos} />
      ))}
    </group>
  );
}

// ── Accident marker (pulsing ring at accident location) ───────────────
function AccidentMarker({ position }: { position: Vec2 }) {
  return (
    <group position={[position.x, 0.3, position.z]}>
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.5, 32]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner warning triangle */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.5, 0.8, 3]} />
        <meshStandardMaterial
          color="#cc8822"
          emissive="#cc6600"
          emissiveIntensity={1}
        />
      </mesh>
      {/* Point light */}
      <pointLight color="#ff4400" intensity={4} distance={10} decay={2} />
    </group>
  );
}

interface Vec2 {
  x: number;
  z: number;
}
