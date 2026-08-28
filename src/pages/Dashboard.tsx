import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Play,
  Radio,
  Shield,
  Route,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      {/* Header */}
      <header className="border-b border-stone-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="font-serif text-base font-bold tracking-wide text-amber-200/90 transition-colors hover:text-amber-100"
            >
              GeoAgent Vision
            </button>
            <span className="text-stone-600">/</span>
            <span className="font-mono text-xs tracking-wider text-stone-400 uppercase">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/catalog")}
              className="rounded border border-stone-700/60 bg-stone-900/40 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase transition-all hover:bg-stone-800/50"
            >
              Catalog
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Title */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-amber-100/90">
            Workspace
          </h1>
          <p className="mt-2 font-mono text-xs text-stone-500">
            Quick access to agents, simulations, and system modules.
          </p>
        </div>

        {/* Primary action cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate("/catalog")}
            className="group flex items-center justify-between rounded-lg border border-stone-700/50 bg-stone-900/30 p-6 text-left transition-all hover:border-amber-800/40 hover:bg-stone-900/50"
          >
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-800/40 bg-amber-900/30 text-amber-400">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-lg font-bold text-amber-200/90">
                Agent Catalog
              </h2>
              <p className="mt-1 font-mono text-xs text-stone-400">
                Browse and search all available agents, scenarios, and modules.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-amber-500" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            onClick={() => navigate("/simulation")}
            className="group flex items-center justify-between rounded-lg border border-stone-700/50 bg-stone-900/30 p-6 text-left transition-all hover:border-amber-800/40 hover:bg-stone-900/50"
          >
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-800/40 bg-amber-900/30 text-amber-400">
                <Play className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-lg font-bold text-amber-200/90">
                Scenario Simulation
              </h2>
              <p className="mt-1 font-mono text-xs text-stone-400">
                Run the 3D urban congestion scenario with full agent telemetry.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-amber-500" />
          </motion.button>
        </div>

        {/* Quick status row */}
        <div className="mb-10">
          <h3 className="mb-4 font-serif text-sm font-bold text-stone-400 uppercase tracking-wider">
            Active Agents
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Trajectory", icon: <Radio className="h-4 w-4" />, status: "Online" },
              { name: "Incident", icon: <Shield className="h-4 w-4" />, status: "Online" },
              { name: "Route", icon: <Route className="h-4 w-4" />, status: "Online" },
              { name: "Decision", icon: <Activity className="h-4 w-4" />, status: "Online" },
            ].map((agent) => (
              <div
                key={agent.name}
                className="rounded-lg border border-stone-700/40 bg-stone-900/30 p-3"
              >
                <div className="mb-1.5 flex items-center gap-2 text-stone-400">
                  {agent.icon}
                  <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
                    {agent.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="font-mono text-[9px] text-green-400/80">
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent scenarios */}
        <div>
          <h3 className="mb-4 font-serif text-sm font-bold text-stone-400 uppercase tracking-wider">
            Available Scenarios
          </h3>
          <div className="space-y-2">
            {[
              {
                name: "Urban Congestion Scenario",
                desc: "Vehicle collision at mid-network junction with progressive traffic buildup.",
                ready: true,
              },
              {
                name: "Multi-Incident Scenario",
                desc: "Simultaneous incidents across multiple junctions to stress-test agent coordination.",
                ready: false,
              },
              {
                name: "Night Operations Scenario",
                desc: "Reduced visibility parameters and adjusted detection confidence thresholds.",
                ready: false,
              },
            ].map((sc) => (
              <button
                key={sc.name}
                onClick={() => sc.ready && navigate("/simulation")}
                className={`group flex w-full items-center justify-between rounded-lg border border-stone-700/40 bg-stone-900/20 p-4 text-left transition-all ${
                  sc.ready
                    ? "hover:border-stone-600/60 hover:bg-stone-900/40 cursor-pointer"
                    : "cursor-default opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-stone-200">
                      {sc.name}
                    </span>
                    {!sc.ready && (
                      <span className="rounded-full border border-stone-700/50 px-2 py-0.5 font-mono text-[8px] font-bold text-stone-500 uppercase">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                    {sc.desc}
                  </p>
                </div>
                {sc.ready && (
                  <ArrowRight className="h-4 w-4 text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-stone-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-800/60 py-6 text-center">
        <p className="font-mono text-[10px] text-stone-600">
          GeoAgent Vision · Internal Release
        </p>
      </div>
    </div>
  );
}
