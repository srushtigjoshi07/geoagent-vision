import { useSimulationStore, type AgentStatus } from "@/lib/simulationStore";

function AgentCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: AgentStatus;
  detail: string;
}) {
  const statusColor =
    status === "active"
      ? "border-amber-600 bg-amber-900/30"
      : status === "processing"
        ? "border-amber-500 bg-amber-800/30"
        : status === "done"
          ? "border-green-700 bg-green-900/30"
          : "border-stone-700 bg-stone-900/50";

  const dotColor =
    status === "active"
      ? "bg-amber-500 animate-pulse"
      : status === "processing"
        ? "bg-amber-400 animate-spin"
        : status === "done"
          ? "bg-green-600"
          : "bg-stone-600";

  return (
    <div
      className={`rounded border px-3 py-2 font-mono text-xs transition-all duration-500 ${statusColor}`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="font-bold tracking-wider text-amber-200/90 uppercase">
          {title}
        </span>
      </div>
      <div className="mt-1 text-stone-300">{detail}</div>
    </div>
  );
}

function FlowArrow({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center px-1">
      <div
        className={`text-xs font-bold transition-all duration-500 ${
          active ? "text-amber-400" : "text-stone-600"
        }`}
      >
        ↓
      </div>
      <div
        className={`h-6 w-px transition-all duration-500 ${
          active ? "bg-amber-500" : "bg-stone-700"
        }`}
      />
    </div>
  );
}

export function AgentPanel() {
  const trajectory = useSimulationStore((s) => s.trajectoryAgent);
  const incident = useSimulationStore((s) => s.incidentAgent);
  const route = useSimulationStore((s) => s.routeAgent);
  const decision = useSimulationStore((s) => s.decisionAgent);

  const anyActive = trajectory !== "idle" || incident !== "idle" || route !== "idle" || decision !== "idle";

  if (!anyActive) return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20">
      <div className="rounded-lg border border-stone-700/60 bg-stone-950/80 p-3 backdrop-blur-sm">
        <div className="mb-2 text-center font-serif text-xs font-bold tracking-[0.2em] text-amber-300/80 uppercase">
          GeoAgent Pipeline
        </div>
        <div className="flex flex-col items-center gap-0">
          <AgentCard
            title="Trajectory Agent"
            status={trajectory}
            detail={
              trajectory === "active"
                ? "Tracking AMB-01"
                : trajectory === "done"
                  ? "Position logged"
                  : "Standby"
            }
          />
          <FlowArrow active={trajectory === "done" && incident !== "idle"} />
          <AgentCard
            title="Incident Agent"
            status={incident}
            detail={
              incident === "active"
                ? "Accident detected — Confidence: 94%"
                : incident === "done"
                  ? "Incident confirmed"
                  : incident === "processing"
                    ? "Analyzing..."
                    : "Standby"
            }
          />
          <FlowArrow active={incident === "done" && route !== "idle"} />
          <AgentCard
            title="Route Agent"
            status={route}
            detail={
              route === "active"
                ? "3 routes evaluated"
                : route === "done"
                  ? "Routes calculated"
                  : "Standby"
            }
          />
          <FlowArrow active={route === "done" && decision !== "idle"} />
          <AgentCard
            title="Decision Agent"
            status={decision}
            detail={
              decision === "active"
                ? "Route B selected"
                : decision === "done"
                  ? "Decision confirmed"
                  : "Standby"
            }
          />
        </div>
      </div>
    </div>
  );
}
