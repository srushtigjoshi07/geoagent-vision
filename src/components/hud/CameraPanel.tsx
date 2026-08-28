import { useSimulationStore } from "@/lib/simulationStore";

export function CameraPanel() {
  const cameraState = useSimulationStore((s) => s.cameraState);
  const phase = useSimulationStore((s) => s.phase);

  if (phase === "idle") return null;

  const stateColor = {
    "NORMAL ROAD": "text-green-400",
    "TRAFFIC DETECTED": "text-yellow-400",
    "ACCIDENT DETECTED": "text-red-400",
    "ROAD BLOCKED": "text-red-500",
  }[cameraState.state];

  const bgColor = {
    "NORMAL ROAD": "border-green-800/60",
    "TRAFFIC DETECTED": "border-yellow-700/60",
    "ACCIDENT DETECTED": "border-red-700/60",
    "ROAD BLOCKED": "border-red-800/60",
  }[cameraState.state];

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20">
      <div
        className={`rounded-lg border bg-stone-950/85 backdrop-blur-sm ${bgColor} overflow-hidden`}
      >
        <div className="flex items-center gap-2 border-b border-stone-800 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase">
            On-Board Camera
          </span>
        </div>

        {/* Simulated camera view */}
        <div className="relative h-28 w-48">
          {/* Road lines (perspective) */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-700">
            {/* Vanishing point road */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 192 112">
              {/* Sky */}
              <rect x="0" y="0" width="192" height="50" fill="#3a3530" />
              {/* Road surface */}
              <polygon points="0,50 192,50 140,112 52,112" fill="#2a2520" />
              {/* Center line */}
              <line x1="96" y1="50" x2="96" y2="112" stroke="#c4a265" strokeWidth="1" strokeDasharray="4 4" />
              {/* Side lines */}
              <line x1="30" y1="50" x2="52" y2="112" stroke="#6a5a4a" strokeWidth="0.5" />
              <line x1="162" y1="50" x2="140" y2="112" stroke="#6a5a4a" strokeWidth="0.5" />
              {/* Distant buildings */}
              <rect x="10" y="20" width="15" height="30" fill="#3a2a1a" />
              <rect x="30" y="15" width="10" height="35" fill="#2a1a0a" />
              <rect x="50" y="25" width="12" height="25" fill="#3a2a1a" />
              <rect x="130" y="18" width="12" height="32" fill="#2a1a0a" />
              <rect x="148" y="22" width="15" height="28" fill="#3a2a1a" />
              <rect x="168" y="15" width="14" height="35" fill="#2a1a0a" />
            </svg>

            {/* Overlay based on state */}
            {cameraState.state === "ACCIDENT DETECTED" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400 animate-pulse">⚠ ACCIDENT</div>
                  <div className="text-xs text-red-300/80">Road blocked ahead</div>
                </div>
              </div>
            )}
            {cameraState.state === "ROAD BLOCKED" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-950/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500 animate-pulse">✕ BLOCKED</div>
                  <div className="text-xs text-red-300/70">Rerouting required</div>
                </div>
              </div>
            )}
          </div>

          {/* Scan lines effect */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
            }}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-stone-800 px-3 py-1.5">
          <span className={`font-mono text-[10px] font-bold ${stateColor}`}>
            {cameraState.state}
          </span>
          <span className="font-mono text-[10px] text-stone-500">
            CAM-01 • 30fps
          </span>
        </div>
      </div>
    </div>
  );
}
