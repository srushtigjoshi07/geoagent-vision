import { useSimulationStore } from "@/lib/simulationStore";

function StepItem({
  label,
  active,
  done,
  isLast,
}: {
  label: string;
  active: boolean;
  done: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full border-2 transition-all duration-500 ${
            done
              ? "border-green-500 bg-green-500"
              : active
                ? "border-amber-400 bg-amber-400 animate-pulse"
                : "border-stone-600 bg-transparent"
          }`}
        />
        {!isLast && (
          <div
            className={`h-4 w-px transition-all duration-500 ${
              done ? "bg-green-500" : "bg-stone-700"
            }`}
          />
        )}
      </div>
      <div className="-mt-0.5">
        <span
          className={`font-mono text-[10px] font-bold tracking-wider transition-all duration-500 ${
            done
              ? "text-green-400"
              : active
                ? "text-amber-300"
                : "text-stone-500"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export function EdgeProcessingPanel() {
  const edgeSteps = useSimulationStore((s) => s.edgeSteps);
  const phase = useSimulationStore((s) => s.phase);

  const show = phase === "detecting" || phase === "analyzing";
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute right-4 bottom-32 z-20">
      <div className="rounded-lg border border-stone-700/60 bg-stone-950/85 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-stone-800 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            Edge Processing
          </span>
        </div>
        <div className="px-3 py-2.5">
          {/* Raspberry Pi icon */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-900/50 border border-green-700/50">
              <span className="text-[8px] font-bold text-green-400">RPi</span>
            </div>
            <span className="font-mono text-[9px] text-stone-400">Raspberry Pi 5</span>
          </div>
          {edgeSteps.map((step, i) => (
            <StepItem
              key={step.label}
              label={step.label}
              active={step.active}
              done={step.done}
              isLast={i === edgeSteps.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
