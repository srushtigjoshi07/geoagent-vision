import { useSimulationStore } from "@/lib/simulationStore";

export function LiveDataPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const ambulance = useSimulationStore((s) => s.ambulance);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);
  const activeAccidents = useSimulationStore((s) => s.activeAccidents);
  const blockedEdges = useSimulationStore((s) => s.allBlockedEdges);
  const altRoutes = useSimulationStore((s) => s.altRoutes);

  if (phase === "idle") return null;

  const statusMap: Record<string, string> = {
    departing: "DEPARTING",
    enroute: "EN ROUTE",
    accident: "EN ROUTE",
    traffic: "SLOWED",
    detecting: "DETECTING",
    analyzing: "ANALYZING",
    rerouting: "REROUTING",
    rerouted: "REROUTED",
    enroute_alt: "EN ROUTE",
    hospital: "ARRIVING",
    completed: "COMPLETE",
  };

  const speed =
    phase === "detecting" || phase === "analyzing" || phase === "rerouting"
      ? 0
      : phase === "enroute_alt"
        ? 50
        : phase === "hospital"
          ? 25
          : phase === "completed"
            ? 0
            : 60;

  // Dynamic ETA based on current route cost
  const selectedRoute = altRoutes.find((r) => r.id === activeRouteId);
  const routeCost = selectedRoute?.cost ?? 12;
  const progress = ambulance.progress;
  const remainingCost = Math.max(0, routeCost * (1 - progress));
  const etaMin =
    phase === "completed" || phase === "hospital" ? 0 : Math.ceil(remainingCost);

  const trafficLevel = activeAccidents.length > 0 ? "HIGH" : "LOW";
  const incidentCount = activeAccidents.length;
  const routeName =
    activeRouteId === "PRIMARY"
      ? "PRIMARY"
      : activeRouteId.replace("ROUTE_", "");

  const statusColor =
    phase === "completed"
      ? "text-green-400"
      : phase === "rerouting" || phase === "analyzing"
        ? "text-green-400"
        : "text-cyan-300";

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20">
      <div className="w-56 rounded-lg border border-stone-700/60 bg-stone-950/85 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-stone-800 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-cyan-500" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            Unit AMB-01
          </span>
        </div>

        <div className="space-y-1.5 px-3 py-2 font-mono text-[10px]">
          <Row label="STATUS" value={statusMap[phase] || phase.toUpperCase()} color={statusColor} />
          <Row label="SPEED" value={`${speed} km/h`} color="text-stone-300" />
          <Row label="ETA" value={`${etaMin} min`} color="text-stone-300" />
          <Row
            label="TRAFFIC"
            value={trafficLevel}
            color={trafficLevel === "HIGH" ? "text-red-400" : "text-green-400"}
          />
          <Row label="ROUTE" value={routeName} color="text-stone-300" />
          {incidentCount > 0 && (
            <div className="border-t border-stone-800 pt-1.5">
              <Row
                label="INCIDENTS"
                value={`${incidentCount} ACTIVE`}
                color="text-red-400"
              />
              <Row
                label="BLOCKED"
                value={`${blockedEdges.size} SEGMENTS`}
                color="text-amber-400"
              />
            </div>
          )}
          {phase === "completed" && (
            <div className="border-t border-stone-800 pt-1.5">
              <Row label="RESULT" value="HOSPITAL REACHED" color="text-green-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
