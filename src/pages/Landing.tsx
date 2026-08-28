import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Shield, Radio, Route, Eye, Zap, MapPin } from "lucide-react";

function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="rounded-lg border border-stone-700/50 bg-stone-900/40 p-5 backdrop-blur-sm"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-800/40 bg-amber-900/30 text-amber-400">
        {icon}
      </div>
      <h3 className="font-serif text-base font-bold text-amber-200/90">{title}</h3>
      <p className="mt-1.5 font-mono text-xs leading-relaxed text-stone-400">{desc}</p>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Decorative grid lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(196,162,101,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(196,162,101,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-800/50 bg-amber-950/50 px-4 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="font-mono text-[10px] font-bold tracking-wider text-amber-400/90 uppercase">
                Internal Tooling
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-5xl font-bold leading-tight tracking-tight text-amber-100/95 sm:text-6xl"
          >
            GeoAgent Vision
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl font-serif text-lg text-stone-400"
          >
            Multi-agent geospatial reasoning for emergency vehicle dispatch.
            Browse the agent catalog, run scenario simulations, and inspect
            pipeline telemetry in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/catalog")}
              className="rounded-lg border border-amber-600/60 bg-amber-900/50 px-6 py-2.5 font-serif text-sm font-bold tracking-wider text-amber-200 uppercase transition-all hover:bg-amber-800/60 hover:border-amber-500"
            >
              Open Catalog
            </button>
            <a
              href="#capabilities"
              className="rounded-lg border border-stone-700/60 bg-stone-900/40 px-6 py-2.5 font-serif text-sm font-bold tracking-wider text-stone-300 uppercase transition-all hover:bg-stone-800/50"
            >
              Capabilities
            </a>
          </motion.div>
        </div>
      </div>

      {/* Capabilities */}
      <div id="capabilities" className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="font-serif text-2xl font-bold text-amber-100/90">
            System Capabilities
          </h2>
          <p className="mt-2 font-mono text-xs text-stone-500">
            See → Detect → Analyze → Predict → Decide → Reroute
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Eye className="h-5 w-5" />}
            title="Vision Detection"
            desc="On-board camera streams feed into a lightweight detection model for real-time incident classification."
            delay={0.1}
          />
          <FeatureCard
            icon={<Radio className="h-5 w-5" />}
            title="Edge Inference"
            desc="Raspberry Pi hardware runs the vision pipeline locally, minimizing round-trip latency to the cloud."
            delay={0.15}
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Multi-Agent Analysis"
            desc="Trajectory, Incident, Route, and Decision agents coordinate through a shared reasoning pipeline."
            delay={0.2}
          />
          <FeatureCard
            icon={<Route className="h-5 w-5" />}
            title="Adaptive Routing"
            desc="Dijkstra-based pathfinding recalculates optimal routes dynamically when network conditions change."
            delay={0.25}
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Reduced Response Time"
            desc="Automated rerouting eliminates manual dispatch overhead, cutting response times by measurable margins."
            delay={0.3}
          />
          <FeatureCard
            icon={<MapPin className="h-5 w-5" />}
            title="3D Scenario Replay"
            desc="Full spatial simulation with isometric rendering, telemetry overlays, and step-through playback."
            delay={0.35}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-800/60 py-8 text-center">
        <p className="font-mono text-[10px] text-stone-600">
          GeoAgent Vision · Internal Release
        </p>
      </div>
    </div>
  );
}
