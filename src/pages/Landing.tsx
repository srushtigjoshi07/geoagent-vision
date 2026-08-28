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
                IEEE Computer Society Bangalore Girl Geeks • PS2
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-5xl font-bold leading-tight tracking-tight text-amber-100/95 sm:text-6xl"
          >
            GeoRescue
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl font-serif text-lg text-stone-400"
          >
            GeoAgentic Framework for Emergency Vehicle Movement — real-time
            accident detection, multi-agent analysis, and intelligent rerouting
            for ambulances in congested urban environments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/simulation")}
              className="rounded-lg border border-amber-600/60 bg-amber-900/50 px-6 py-2.5 font-serif text-sm font-bold tracking-wider text-amber-200 uppercase transition-all hover:bg-amber-800/60 hover:border-amber-500"
            >
              Launch Simulation
            </button>
            <a
              href="#features"
              className="rounded-lg border border-stone-700/60 bg-stone-900/40 px-6 py-2.5 font-serif text-sm font-bold tracking-wider text-stone-300 uppercase transition-all hover:bg-stone-800/50"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="font-serif text-2xl font-bold text-amber-100/90">
            How It Works
          </h2>
          <p className="mt-2 font-mono text-xs text-stone-500">
            See → Detect → Analyze → Predict → Decide → Reroute
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Eye className="h-5 w-5" />}
            title="Camera Detection"
            desc="Vehicle-mounted cameras continuously scan the road, detecting accidents and obstacles in real time."
            delay={0.1}
          />
          <FeatureCard
            icon={<Radio className="h-5 w-5" />}
            title="Edge Processing"
            desc="On-board Raspberry Pi performs vision processing at the edge, enabling low-latency incident detection."
            delay={0.15}
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="GeoAgent Analysis"
            desc="Multi-agent pipeline: Trajectory, Incident, Route, and Decision agents collaborate to assess the situation."
            delay={0.2}
          />
          <FeatureCard
            icon={<Route className="h-5 w-5" />}
            title="Dynamic Rerouting"
            desc="Real-time pathfinding recalculates optimal routes when congestion or blockages are detected."
            delay={0.25}
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Time Savings"
            desc="Intelligent rerouting saves critical minutes, improving emergency response outcomes."
            delay={0.3}
          />
          <FeatureCard
            icon={<MapPin className="h-5 w-5" />}
            title="3D Digital Twin"
            desc="Full 3D city simulation with real-time visualization of vehicles, traffic, and agent decisions."
            delay={0.35}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-800/60 py-8 text-center">
        <p className="font-mono text-[10px] text-stone-600">
          GeoRescue Prototype v1.0 — Built for IEEE CS Bangalore Girl Geeks Hackathon
        </p>
      </div>
    </div>
  );
}
