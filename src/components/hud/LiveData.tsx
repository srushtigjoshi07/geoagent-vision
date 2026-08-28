import { useSimulationStore } from "@/lib/simulationStore";

export function LiveDataPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const ambulance = useSimulationStore((s) => s.ambulance);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);
  const accident = useSimulationStore((s) => s.accident);

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
    completed: "MISSION COMPLETE",
  };

  const speed = phase === "detecting" || phase === "analyzing" || phase === "rerouting"
    ? 0
    : phase === "enroute_alt"
      ? 50
      : phase === "hospital"
        ? 20
        : 60;

  const etaMap: Record<string, string> = {
    departing: "12 min",
    enroute: "10 min",
    accident: "16 min",
    traffic: "16 min",
    detecting: "16 min",
    analyzing: "16 min",
    rerouting: "—",
    rerouted: "—",
    enroute_alt: "8 min",
    hospital: "0 min",
    completed: "0 min",
  };

  const trafficLevel = accident.active ? "HIGH" : "LOW";
  const routeName = activeRouteId === "PRIMARY" ? "PRIMARY" : activeRouteId.replace("ROUTE_", "ALTERNATIVE ");

  const statusColor =
    phase === "completed"
      ? "text-green-400"
      : phase === "rerouting" || phase === "analyzing"
        ? "text-amber-400"
        : "text-cyan-300";

  const timeSaved =
    activeRouteId !== "PRIMARY" && (phase === "enroute_alt" || phase === "hospital" || phase === "completed")
      ? "6 min"
      : null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20">
      <div className="w-56 rounded-lg border border-stone-700/60 bg-stone-950/85 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-stone-800 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-cyan-500" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            AMB-01
          </span>
        </div>

        <div className="space-y-1.5 px-3 py-2 font-mono text-[10px]">
          <Row label="STATUS" value={statusMap[phase] || phase.toUpperCase()} color={statusColor} />
          <Row label="SPEED" value={`${speed} km/h`} color="text-stone-300" />
          <Row label="ETA" value={etaMap[phase] || "—"} color="text-stone-300" />
          <Row
            label="TRAFFIC"
            value={trafficLevel}
            color={trafficLevel === "HIGH" ? "text-red-400" : "text-green-400"}
          />
          <Row label="ROUTE" value={routeName} color="text-stone-300" />
          {timeSaved && (
            <div className="border-t border-stone-800 pt-1.5">
              <Row label="TIME SAVED" value={timeSaved} color="text-green-400 font-bold" />
            </div>
          )}
          {accident.active && (
            <div className="border-t border-stone-800 pt-1.5">
              <Row label="INCIDENT" value="ACCIDENT" color="text-red-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
