import { useSimulationStore } from "@/lib/simulationStore";

export function RouteInfoPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const altRoutes = useSimulationStore((s) => s.altRoutes);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);
  const allBlockedEdges = useSimulationStore((s) => s.allBlockedEdges);

  // Show panel when we have route data OR when an accident is active
  const show =
    altRoutes.length > 0 ||
    (phase !== "idle" && phase !== "completed" && phase !== "departing");

  if (!show) return null;

  const blockedCount = allBlockedEdges.size;

  return (
    <div className="pointer-events-none absolute left-4 bottom-4 z-20">
      <div className="w-52 rounded-lg border border-stone-700/60 bg-stone-950/85 backdrop-blur-sm">
        <div className="border-b border-stone-800 px-3 py-1.5">
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            Route Analysis
          </span>
        </div>
        <div className="space-y-1 px-3 py-2">
          {/* Blocked edges indicator */}
          {blockedCount > 0 && (
            <div className="flex items-center justify-between rounded border border-red-800/50 bg-red-950/30 px-2 py-1">
              <span className="font-mono text-[10px] text-red-400">
                {blockedCount} BLOCKED
              </span>
              <span className="font-mono text-[10px] font-bold text-red-400">
                ✕
              </span>
            </div>
          )}

          {/* Available routes */}
          {altRoutes.map((route) => {
            const isActive = route.id === activeRouteId;
            const borderColor = route.isRecommended
              ? "border-stone-400/70 bg-stone-800/50"
              : "border-stone-700/30 bg-stone-900/20";
            const textColor = route.isRecommended
              ? "text-stone-200"
              : "text-stone-400";

            return (
              <div
                key={route.id}
                className={`flex items-center justify-between rounded border px-2 py-1 ${borderColor}`}
              >
                <span className={`font-mono text-[10px] ${textColor}`}>
                  {route.label} — {route.cost} min
                </span>
                <span
                  className={`font-mono text-[9px] font-bold ${
                    route.isRecommended
                      ? "text-stone-300"
                      : "text-stone-500"
                  }`}
                >
                  {route.isRecommended ? "SELECTED" : ""}
                  {isActive ? " ✓" : ""}
                </span>
              </div>
            );
          })}

          {/* Fallback when no routes yet */}
          {altRoutes.length === 0 && blockedCount === 0 && (
            <div className="px-2 py-1">
              <span className="font-mono text-[10px] text-stone-500">
                {phase === "departing"
                  ? "Awaiting departure..."
                  : phase === "enroute"
                    ? "Primary route active"
                    : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
