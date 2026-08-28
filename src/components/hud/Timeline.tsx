import { useSimulationStore } from "@/lib/simulationStore";

export function TimelinePanel() {
  const timeline = useSimulationStore((s) => s.timeline);
  const phase = useSimulationStore((s) => s.phase);

  if (phase === "idle") return null;

  return (
    <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-lg border border-stone-700/50 bg-stone-950/75 px-3 py-1.5 backdrop-blur-sm">
        {timeline.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`h-2 w-2 rounded-full transition-all duration-500 ${
                  step.done
                    ? "bg-amber-400"
                    : step.active
                      ? "bg-amber-500 animate-pulse"
                      : "bg-stone-600"
                }`}
              />
              <span
                className={`mt-0.5 font-mono text-[7px] font-bold tracking-wider transition-all duration-500 ${
                  step.done || step.active
                    ? "text-amber-300/80"
                    : "text-stone-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < timeline.length - 1 && (
              <div
                className={`mx-1 h-px w-4 transition-all duration-500 ${
                  step.done ? "bg-amber-500" : "bg-stone-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
