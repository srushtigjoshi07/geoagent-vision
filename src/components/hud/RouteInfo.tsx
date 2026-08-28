import { useSimulationStore } from "@/lib/simulationStore";

export function RouteInfoPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const altRoutes = useSimulationStore((s) => s.altRoutes);
  const activeRouteId = useSimulationStore((s) => s.activeRouteId);

  const showAlts = altRoutes.length > 0;

  if (!showAlts) return null;

  return (
    <div className="pointer-events-none absolute left-4 bottom-4 z-20">
      <div className="w-52 rounded-lg border border-stone-700/60 bg-stone-950/85 backdrop-blur-sm">
        <div className="border-b border-stone-800 px-3 py-1.5">
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            Route Analysis
          </span>
        </div>
        <div className="space-y-1 px-3 py-2">
          {/* Primary route - congested */}
          <div className="flex items-center justify-between rounded border border-red-800/50 bg-red-950/30 px-2 py-1">
            <span className="font-mono text-[10px] text-red-400">Original</span>
            <span className="font-mono text-[10px] font-bold text-red-400">
              CONGESTED
            </span>
          </div>

          {/* Alt routes */}
          {altRoutes.map((route) => {
            const isActive = route.id === activeRouteId;
            const borderColor = route.isRecommended
              ? "border-green-600/70 bg-green-950/30"
              : "border-stone-700/40 bg-stone-900/30";
            const textColor = route.isRecommended ? "text-green-300" : "text-stone-400";

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
                    route.isRecommended ? "text-green-400" : "text-stone-500"
                  }`}
                >
                  {route.isRecommended ? "RECOMMENDED" : ""}
                  {isActive ? " ✓" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
