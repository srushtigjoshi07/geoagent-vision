import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Search, ArrowRight, Radio, Eye, Shield, Route, Activity, Box, Cpu, Satellite } from "lucide-react";

interface CatalogEntry {
  id: string;
  name: string;
  category: "agent" | "scenario" | "module";
  status: "active" | "beta" | "deprecated";
  description: string;
  tags: string[];
  route?: string;
}

const CATALOG: CatalogEntry[] = [
  {
    id: "trajectory",
    name: "Trajectory Agent",
    category: "agent",
    status: "active",
    description: "Tracks vehicle positions across the road network and logs movement telemetry at configurable intervals.",
    tags: ["tracking", "telemetry", "real-time"],
    route: "/simulation",
  },
  {
    id: "incident",
    name: "Incident Agent",
    category: "agent",
    status: "active",
    description: "Classifies road events from camera feeds using a confidence-weighted detection model.",
    tags: ["vision", "classification", "edge"],
    route: "/simulation",
  },
  {
    id: "route",
    name: "Route Agent",
    category: "agent",
    status: "active",
    description: "Evaluates alternative paths through the road graph when the primary route is compromised.",
    tags: ["pathfinding", "graph", "optimization"],
    route: "/simulation",
  },
  {
    id: "decision",
    name: "Decision Agent",
    category: "agent",
    status: "active",
    description: "Selects the optimal route based on cost, congestion, and time-to-destination heuristics.",
    tags: ["decision", "heuristic", "selection"],
    route: "/simulation",
  },
  {
    id: "sc-urban",
    name: "Urban Congestion Scenario",
    category: "scenario",
    status: "active",
    description: "Simulates a vehicle collision at a mid-network junction with progressive traffic buildup and agent rerouting.",
    tags: ["congestion", "rerouting", "urban"],
    route: "/simulation",
  },
  {
    id: "sc-multi",
    name: "Multi-Incident Scenario",
    category: "scenario",
    status: "beta",
    description: "Introduces simultaneous incidents across multiple junctions to stress-test agent coordination.",
    tags: ["multi-agent", "stress-test", "coordination"],
  },
  {
    id: "sc-night",
    name: "Night Operations Scenario",
    category: "scenario",
    status: "beta",
    description: "Reduces visibility parameters and adjusts detection confidence thresholds for low-light conditions.",
    tags: ["night", "low-light", "visibility"],
  },
  {
    id: "edge-pi",
    name: "Edge Processing Module",
    category: "module",
    status: "active",
    description: "Raspberry Pi 5 vision pipeline: camera frame capture, model inference, and incident flagging.",
    tags: ["raspberry-pi", "vision", "inference"],
  },
  {
    id: "road-graph",
    name: "Road Graph Engine",
    category: "module",
    status: "active",
    description: "Bidirectional Dijkstra pathfinding with dynamic edge weighting for congestion and blockage simulation.",
    tags: ["dijkstra", "graph", "routing"],
  },
  {
    id: "sim-render",
    name: "3D Simulation Renderer",
    category: "module",
    status: "active",
    description: "React Three Fiber isometric renderer with procedural city generation and real-time entity tracking.",
    tags: ["three.js", "r3f", "rendering"],
  },
  {
    id: "hud-overlay",
    name: "HUD Overlay System",
    category: "module",
    status: "active",
    description: "Composable panel framework for agent telemetry, camera feeds, and pipeline status indicators.",
    tags: ["hud", "overlay", "telemetry"],
  },
  {
    id: "ds-fleet",
    name: "Fleet Telemetry Dataset",
    category: "scenario",
    status: "deprecated",
    description: "Historical fleet data collected during Phase 1 testing. Retained for reference only.",
    tags: ["dataset", "historical", "reference"],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Agents",
  scenario: "Scenarios",
  module: "Modules",
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-green-800/50 bg-green-950/30 text-green-400",
  beta: "border-amber-800/50 bg-amber-950/30 text-amber-400",
  deprecated: "border-stone-700/50 bg-stone-900/30 text-stone-500",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  agent: <Shield className="h-4 w-4" />,
  scenario: <Activity className="h-4 w-4" />,
  module: <Cpu className="h-4 w-4" />,
};

export default function Catalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return CATALOG.filter((entry) => {
      const matchesCategory = activeCategory === "all" || entry.category === activeCategory;
      if (!matchesCategory) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.includes(q))
      );
    });
  }, [search, activeCategory]);

  const categories = ["all", "agent", "scenario", "module"];

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
              Catalog
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/simulation")}
              className="rounded border border-stone-700/60 bg-stone-900/40 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider text-stone-300 uppercase transition-all hover:bg-stone-800/50"
            >
              Open Simulation
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Title + search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-amber-100/90">
              Agent Catalog
            </h1>
            <p className="mt-1 font-mono text-xs text-stone-500">
              Browse available agents, scenarios, and system modules.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents, tags, descriptions..."
              className="w-full rounded-lg border border-stone-700/60 bg-stone-900/60 py-2 pl-9 pr-3 font-mono text-xs text-stone-200 placeholder-stone-600 outline-none transition-colors focus:border-amber-800/60 focus:bg-stone-900/80"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-6 flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase transition-all ${
                activeCategory === cat
                  ? "border-amber-700/60 bg-amber-900/40 text-amber-300"
                  : "border-stone-700/40 bg-stone-900/30 text-stone-500 hover:border-stone-600 hover:text-stone-400"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
          <span className="ml-2 self-center font-mono text-[10px] text-stone-600">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              onClick={() => entry.route && navigate(entry.route)}
              className={`group relative rounded-lg border border-stone-700/50 bg-stone-900/30 p-5 transition-all hover:border-stone-600/70 hover:bg-stone-900/50 ${
                entry.route ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Top row */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded border border-stone-700/60 bg-stone-800/60 text-stone-400">
                    {CATEGORY_ICONS[entry.category]}
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-amber-200/90">
                      {entry.name}
                    </h3>
                    <span className="font-mono text-[9px] text-stone-600 uppercase">
                      {entry.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider uppercase ${STATUS_STYLES[entry.status]}`}
                >
                  {entry.status}
                </span>
              </div>

              {/* Description */}
              <p className="mb-3 font-mono text-[11px] leading-relaxed text-stone-400">
                {entry.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-stone-800/60 bg-stone-950/50 px-1.5 py-0.5 font-mono text-[8px] text-stone-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Launch arrow */}
              {entry.route && (
                <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-amber-500/70" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-sm text-stone-500">
              No results match your search.
            </p>
          </div>
        )}
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
