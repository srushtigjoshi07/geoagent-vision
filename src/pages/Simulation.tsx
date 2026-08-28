import { SimulationScene } from "@/components/simulation/SimulationScene";
import { AgentPanel } from "@/components/hud/AgentPanel";
import { CameraPanel } from "@/components/hud/CameraPanel";
import { EdgeProcessingPanel } from "@/components/hud/EdgeProcessing";
import { LiveDataPanel } from "@/components/hud/LiveData";
import { RouteInfoPanel } from "@/components/hud/RouteInfo";
import { ControlsPanel } from "@/components/hud/Controls";
import { TimelinePanel } from "@/components/hud/Timeline";
import { useSimulationStore } from "@/lib/simulationStore";

export default function Simulation() {
  const phase = useSimulationStore((s) => s.phase);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-stone-950">
      {/* 3D Canvas fills the screen */}
      <div className="absolute inset-0">
        <SimulationScene />
      </div>

      {/* Title overlay */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
        <div className="rounded border border-stone-700/50 bg-stone-950/80 px-5 py-2 backdrop-blur-sm">
          <h1 className="font-serif text-sm font-bold tracking-[0.15em] text-amber-200/90 uppercase">
            GeoRescue — Emergency Vehicle Movement Simulation
          </h1>
          <p className="mt-0.5 font-mono text-[9px] tracking-wider text-stone-400">
            IEEE Computer Society Bangalore Girl Geeks PS2 • GeoAgentic Framework
          </p>
        </div>
      </div>

      {/* HUD Panels */}
      <AgentPanel />
      <CameraPanel />
      <EdgeProcessingPanel />
      <LiveDataPanel />
      <RouteInfoPanel />
      <TimelinePanel />
      <ControlsPanel />

      {/* Idle prompt */}
      {phase === "idle" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-lg font-bold tracking-wider text-amber-200/70 uppercase">
              Click RUN DEMO to start the simulation
            </p>
            <p className="mt-2 font-mono text-xs text-stone-400">
              Orbit: drag • Zoom: scroll • Pan: right-drag
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
