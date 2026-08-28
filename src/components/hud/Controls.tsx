import { useSimulationStore } from "@/lib/simulationStore";

export function ControlsPanel() {
  const phase = useSimulationStore((s) => s.phase);
  const isPaused = useSimulationStore((s) => s.isPaused);
  const startDemo = useSimulationStore((s) => s.startDemo);
  const pause = useSimulationStore((s) => s.pause);
  const resume = useSimulationStore((s) => s.resume);
  const reset = useSimulationStore((s) => s.reset);

  const isIdle = phase === "idle";
  const isRunning = !isIdle && phase !== "completed";

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="flex gap-2 rounded-lg border border-stone-700/60 bg-stone-950/85 px-3 py-2 backdrop-blur-sm">
        {isIdle && (
          <button
            onClick={startDemo}
            className="rounded border border-amber-600/60 bg-amber-900/50 px-4 py-1.5 font-mono text-[11px] font-bold tracking-wider text-amber-200 uppercase transition-all hover:bg-amber-800/60 hover:border-amber-500"
          >
            ▶ Run Scenario
          </button>
        )}

        {isRunning && !isPaused && (
          <button
            onClick={pause}
            className="rounded border border-stone-600/60 bg-stone-800/50 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase transition-all hover:bg-stone-700/60"
          >
            ⏸ Pause
          </button>
        )}

        {isRunning && isPaused && (
          <button
            onClick={resume}
            className="rounded border border-cyan-600/60 bg-cyan-900/50 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-cyan-300 uppercase transition-all hover:bg-cyan-800/60"
          >
            ▶ Resume
          </button>
        )}

        {!isIdle && (
          <button
            onClick={reset}
            className="rounded border border-stone-600/60 bg-stone-800/50 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-stone-400 uppercase transition-all hover:bg-stone-700/60 hover:text-stone-300"
          >
            ↺ Reset
          </button>
        )}

        {phase === "completed" && (
          <div className="flex items-center px-3">
            <span className="font-mono text-[11px] font-bold tracking-wider text-green-400 uppercase animate-pulse">
              ✓ Scenario Complete
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
