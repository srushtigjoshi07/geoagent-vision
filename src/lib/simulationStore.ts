import { create } from "zustand";
import {
  buildGraph,
  dijkstra,
  getPositionOnPath,
  findNearestNode,
  findAlternativeRoutes,
  edgeKey,
  getRouteEdges,
  type CityGraph,
  type Vec2,
  type CityEdge,
  PRIMARY_ROUTE,
  ACCIDENT_SCENARIOS,
  type AccidentScenario,
} from "./cityGraph";

// ── Simulation phase ──────────────────────────────────────────────────
export type SimPhase =
  | "idle"
  | "departing"
  | "enroute"
  | "accident"
  | "traffic"
  | "detecting"
  | "analyzing"
  | "rerouting"
  | "rerouted"
  | "enroute_alt"
  | "hospital"
  | "completed";

export type AgentStatus = "idle" | "active" | "processing" | "done";

export interface AmbulanceState {
  position: Vec2;
  angle: number;
  speed: number;
  progress: number;
  currentRoute: string[];
  flashingLights: boolean;
}

export interface ActiveAccident {
  scenario: AccidentScenario;
  time: number;
}

export interface RouteDisplay {
  id: string;
  label: string;
  path: string[];
  cost: number;
  isRecommended: boolean;
  visible: boolean;
}

export interface CameraState {
  state: "NORMAL ROAD" | "TRAFFIC DETECTED" | "ACCIDENT DETECTED" | "ROAD BLOCKED";
}

export interface EdgeProcessingStep {
  label: string;
  active: boolean;
  done: boolean;
}

export interface TimelineStep {
  id: string;
  label: string;
  active: boolean;
  done: boolean;
}

interface SimulationState {
  phase: SimPhase;
  isPaused: boolean;
  timeElapsed: number;

  ambulance: AmbulanceState;
  accident: { position: Vec2; active: boolean; detected: boolean };
  activeAccidents: ActiveAccident[];

  primaryRoute: string[];
  altRoutes: RouteDisplay[];
  activeRouteId: string;
  allBlockedEdges: Set<string>;

  trajectoryAgent: AgentStatus;
  incidentAgent: AgentStatus;
  routeAgent: AgentStatus;
  decisionAgent: AgentStatus;

  cameraState: CameraState;
  edgeSteps: EdgeProcessingStep[];
  timeline: TimelineStep[];
  graph: CityGraph;

  trafficCorridor: Vec2[];
  corridorActive: boolean;

  // Dynamic rerouting control
  nextAccidentIdx: number;
  rerouteCooldown: number;

  startDemo: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  triggerAccident: () => void;
  triggerTraffic: () => void;
  clearIncident: () => void;
  tick: (dt: number) => void;
}

const INITIAL_AMBULANCE: AmbulanceState = {
  position: { x: -40, z: 0 },
  angle: 0,
  speed: 60,
  progress: 0,
  currentRoute: [...PRIMARY_ROUTE],
  flashingLights: true,
};

function createTimeline(): TimelineStep[] {
  return [
    { id: "departed", label: "DEPARTED", active: false, done: false },
    { id: "accident", label: "ACCIDENT", active: false, done: false },
    { id: "detected", label: "DETECTED", active: false, done: false },
    { id: "analyzed", label: "ANALYZED", active: false, done: false },
    { id: "route_selected", label: "ROUTE SELECTED", active: false, done: false },
    { id: "rerouted", label: "REROUTED", active: false, done: false },
    { id: "hospital", label: "HOSPITAL", active: false, done: false },
  ];
}

function createEdgeSteps(): EdgeProcessingStep[] {
  return [
    { label: "CAMERA FRAME", active: false, done: false },
    { label: "RASPBERRY PI", active: false, done: false },
    { label: "VISION PROCESSING", active: false, done: false },
    { label: "INCIDENT DETECTED", active: false, done: false },
  ];
}

// Phase durations (seconds) — used for automatic phase advancement
const PHASE_DURATIONS: Partial<Record<SimPhase, number>> = {
  departing: 2,
  enroute: 5.5,
  accident: 1.5,
  traffic: 2.5,
  detecting: 2,
  analyzing: 2,
  rerouting: 2,
  rerouted: 1.2,
  enroute_alt: 6,
  hospital: 2,
};

const PHASE_ORDER: SimPhase[] = [
  "departing", "enroute", "accident", "traffic",
  "detecting", "analyzing", "rerouting", "rerouted",
  "enroute_alt", "hospital", "completed",
];

const AMBULANCE_SPEED = 0.12;

// ── Apply accident to graph (mutates edges) ───────────────────────────

function applyAccidentToGraph(
  graph: CityGraph,
  scenario: AccidentScenario,
): void {
  for (const e of graph.edges) {
    const k = edgeKey(e.from, e.to);
    for (const [a, b] of scenario.blockedEdges) {
      if (edgeKey(a, b) === k) {
        e.isBlocked = true;
      }
    }
  }
}

function addCongestionToGraph(graph: CityGraph): void {
  for (const e of graph.edges) {
    if (
      (e.from === "JB" && (e.to === "JC" || e.to === "JA")) ||
      (e.to === "JB" && (e.from === "JC" || e.from === "JA"))
    ) {
      e.isCongested = true;
    }
  }
}

function rebuildBlockedSet(graph: CityGraph): Set<string> {
  const s = new Set<string>();
  for (const e of graph.edges) {
    if (e.isBlocked) s.add(edgeKey(e.from, e.to));
  }
  return s;
}

/**
 * Sample evenly-spaced world positions along a route for corridor checks.
 */
function sampleRoutePositions(route: string[], graph: CityGraph): Vec2[] {
  const positions: Vec2[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = graph.nodes.get(route[i])!.position;
    const b = graph.nodes.get(route[i + 1])!.position;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.max(1, Math.ceil(len / 2.5));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      positions.push({ x: a.x + dx * t, z: a.z + dz * t });
    }
  }
  const lastNode = graph.nodes.get(route[route.length - 1]);
  if (lastNode) positions.push({ ...lastNode.position });
  return positions;
}

/**
 * Check if the ambulance's current route has a blocked edge ahead.
 * Returns the blocked edge key if found, null otherwise.
 */
function findBlockedEdgeAhead(
  path: string[],
  progress: number,
  graph: CityGraph,
): string | null {
  if (path.length < 2) return null;
  const edges = getRouteEdges(path);
  const totalEdges = edges.length;
  const currentEdgeIdx = Math.floor(progress * totalEdges);
  for (let i = currentEdgeIdx; i < totalEdges; i++) {
    if (graph.edges.find((e) => edgeKey(e.from, e.to) === edges[i] && e.isBlocked)) {
      return edges[i];
    }
  }
  return null;
}

/**
 * Build route displays from a list of PathResults.
 */
function buildRouteDisplays(
  routes: { path: string[]; totalCost: number }[],
  activeRouteId: string,
): RouteDisplay[] {
  return routes.map((r, i) => ({
    id: i === 0 ? "ROUTE_OPTIMAL" : `ROUTE_ALT_${i}`,
    label: i === 0 ? "Optimal" : `Route ${String.fromCharCode(64 + i)}`,
    path: r.path,
    cost: r.totalCost,
    isRecommended: false,
    visible: true,
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════

export const useSimulationStore = create<SimulationState>((set, get) => ({
  phase: "idle",
  isPaused: false,
  timeElapsed: 0,

  ambulance: { ...INITIAL_AMBULANCE, currentRoute: [...PRIMARY_ROUTE] },
  accident: { position: { x: 0, z: 0 }, active: false, detected: false },
  activeAccidents: [],

  primaryRoute: [...PRIMARY_ROUTE],
  altRoutes: [],
  activeRouteId: "PRIMARY",
  allBlockedEdges: new Set<string>(),

  trajectoryAgent: "idle",
  incidentAgent: "idle",
  routeAgent: "idle",
  decisionAgent: "idle",

  cameraState: { state: "NORMAL ROAD" },
  edgeSteps: createEdgeSteps(),
  timeline: createTimeline(),
  graph: buildGraph(),

  trafficCorridor: [],
  corridorActive: false,

  nextAccidentIdx: 0,
  rerouteCooldown: 0,

  // ── Start ─────────────────────────────────────────────────────────
  startDemo: () => {
    const graph = buildGraph();
    const corridor = sampleRoutePositions(PRIMARY_ROUTE, graph);
    set({
      phase: "departing",
      isPaused: false,
      timeElapsed: 0,
      ambulance: { ...INITIAL_AMBULANCE, currentRoute: [...PRIMARY_ROUTE] },
      accident: { position: { x: 0, z: 0 }, active: false, detected: false },
      activeAccidents: [],
      primaryRoute: [...PRIMARY_ROUTE],
      altRoutes: [],
      activeRouteId: "PRIMARY",
      allBlockedEdges: new Set(),
      trajectoryAgent: "active",
      incidentAgent: "idle",
      routeAgent: "idle",
      decisionAgent: "idle",
      cameraState: { state: "NORMAL ROAD" },
      edgeSteps: createEdgeSteps(),
      timeline: createTimeline(),
      graph,
      trafficCorridor: corridor,
      corridorActive: true,
      nextAccidentIdx: 0,
      rerouteCooldown: 0,
    });
    setTimeout(() => {
      const s = get();
      if (s.phase !== "idle") {
        const tl = [...s.timeline];
        const idx = tl.findIndex((t) => t.id === "departed");
        if (idx >= 0) tl[idx].done = true;
        set({ timeline: tl });
      }
    }, 1500);
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  reset: () =>
    set({
      phase: "idle",
      isPaused: false,
      timeElapsed: 0,
      ambulance: { ...INITIAL_AMBULANCE, currentRoute: [...PRIMARY_ROUTE] },
      accident: { position: { x: 0, z: 0 }, active: false, detected: false },
      activeAccidents: [],
      primaryRoute: [...PRIMARY_ROUTE],
      altRoutes: [],
      activeRouteId: "PRIMARY",
      allBlockedEdges: new Set(),
      trajectoryAgent: "idle",
      incidentAgent: "idle",
      routeAgent: "idle",
      decisionAgent: "idle",
      cameraState: { state: "NORMAL ROAD" },
      edgeSteps: createEdgeSteps(),
      timeline: createTimeline(),
      graph: buildGraph(),
      trafficCorridor: [],
      corridorActive: false,
      nextAccidentIdx: 0,
      rerouteCooldown: 0,
    }),

  triggerAccident: () => {
    const state = get();
    if (state.phase === "idle" || state.phase === "completed") return;
    set({
      accident: { position: { x: 0, z: 0 }, active: true, detected: false },
      cameraState: { state: "ACCIDENT DETECTED" },
    });
  },

  triggerTraffic: () => {
    const s = get();
    if (!s.accident.active) return;
    set({
      cameraState: { state: "ROAD BLOCKED" },
    });
  },

  clearIncident: () => {
    set({
      accident: { position: { x: 0, z: 0 }, active: false, detected: false },
      cameraState: { state: "NORMAL ROAD" },
    });
  },

  // ── Main tick ─────────────────────────────────────────────────────
  tick: (dt: number) => {
    const state = get();
    if (state.isPaused || state.phase === "idle" || state.phase === "completed") return;

    const newTime = state.timeElapsed + dt;
    const duration = PHASE_DURATIONS[state.phase];
    const updates: Partial<SimulationState> = { timeElapsed: newTime };

    let nextPhase: SimPhase = state.phase;

    // ── Phase transitions (time-based) ──────────────────────────────
    if (duration && newTime > duration) {
      const idx = PHASE_ORDER.indexOf(state.phase);
      if (idx >= 0 && idx < PHASE_ORDER.length - 1) {
        nextPhase = PHASE_ORDER[idx + 1];
        updates.phase = nextPhase;
      }

      switch (nextPhase) {
        case "enroute": {
          updates.cameraState = { state: "NORMAL ROAD" };
          break;
        }
        case "accident": {
          // Apply first accident scenario
          const graph = buildGraph();
          const scenario = ACCIDENT_SCENARIOS[0]; // Junction B
          applyAccidentToGraph(graph, scenario);
          addCongestionToGraph(graph);
          const accidents = [{ scenario, time: newTime }];
          updates.graph = graph;
          updates.activeAccidents = accidents;
          updates.allBlockedEdges = rebuildBlockedSet(graph);
          updates.accident = {
            position: { ...scenario.position },
            active: true,
            detected: false,
          };
          updates.cameraState = { state: "ACCIDENT DETECTED" };
          const tl = [...state.timeline];
          const ti = tl.findIndex((t) => t.id === "accident");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "traffic": {
          updates.cameraState = { state: "ROAD BLOCKED" };
          break;
        }
        case "detecting": {
          updates.incidentAgent = "active";
          updates.trajectoryAgent = "done";
          const tl = [...(updates.timeline ?? state.timeline)];
          const ti = tl.findIndex((t) => t.id === "detected");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "analyzing": {
          updates.incidentAgent = "done";
          updates.routeAgent = "active";
          const tl = [...(updates.timeline ?? state.timeline)];
          const ti = tl.findIndex((t) => t.id === "analyzed");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "rerouting": {
          // Find multiple alternative routes from ambulance's current position
          const amb = updates.ambulance ?? state.ambulance;
          const graph = updates.graph ?? state.graph;
          const nearestNode = findNearestNode(graph, amb.position);

          const routes = findAlternativeRoutes(graph, nearestNode, "HOSPITAL", 5);
          const routeDisplays = buildRouteDisplays(routes, state.activeRouteId);

          if (routeDisplays.length > 0) {
            routeDisplays[0].isRecommended = true;
          }

          updates.altRoutes = routeDisplays;
          updates.routeAgent = "done";
          updates.decisionAgent = "active";
          const tl = [...(updates.timeline ?? state.timeline)];
          const ti = tl.findIndex((t) => t.id === "route_selected");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "rerouted": {
          const alts = updates.altRoutes ?? state.altRoutes;
          const rec = alts.find((r) => r.isRecommended);
          if (rec) {
            updates.activeRouteId = rec.id;
            const newRoute = [...rec.path];
            // Prepend nearest node if not already first
            const amb2 = updates.ambulance ?? state.ambulance;
            const graph2 = updates.graph ?? state.graph;
            const nearest = findNearestNode(graph2, amb2.position);
            if (newRoute[0] !== nearest) newRoute.unshift(nearest);
            updates.ambulance = {
              ...(updates.ambulance ?? state.ambulance),
              currentRoute: newRoute,
              progress: 0,
              speed: 50,
            };
            updates.trafficCorridor = sampleRoutePositions(newRoute, graph2);
            updates.corridorActive = true;
          }
          updates.decisionAgent = "done";
          updates.cameraState = { state: "NORMAL ROAD" };
          const tl = [...(updates.timeline ?? state.timeline)];
          const ti = tl.findIndex((t) => t.id === "rerouted");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "hospital": {
          const tl = [...(updates.timeline ?? state.timeline)];
          const ti = tl.findIndex((t) => t.id === "hospital");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          updates.ambulance = {
            ...(updates.ambulance ?? state.ambulance),
            speed: 25,
          };
          break;
        }
        case "completed": {
          updates.ambulance = {
            ...(updates.ambulance ?? state.ambulance),
            speed: 0,
            flashingLights: false,
          };
          updates.corridorActive = false;
          break;
        }
      }
    }

    // ── Dynamic rerouting during enroute_alt ────────────────────────
    // Check for blocked edges ahead and trigger mini-reroutes
    if (nextPhase === "enroute_alt" || (updates.phase ?? state.phase) === "enroute_alt") {
      const amb = { ...(updates.ambulance ?? state.ambulance) };
      const graph = updates.graph ?? state.graph;
      const cooldown = (updates.rerouteCooldown ?? state.rerouteCooldown) - dt;

      if (cooldown <= 0) {
        const blocked = findBlockedEdgeAhead(amb.currentRoute, amb.progress, graph);
        if (blocked) {
          // Blocked edge found ahead — reroute
          const nearestNode = findNearestNode(graph, amb.position);
          const routes = findAlternativeRoutes(graph, nearestNode, "HOSPITAL", 5);

          if (routes.length > 0) {
            const best = routes[0];
            const newRoute = [nearestNode, ...best.path.slice(best.path.indexOf(nearestNode) + 1)];
            if (newRoute.length >= 2) {
              // Only reroute if meaningfully different from current route
              const currentEdges = getRouteEdges(amb.currentRoute);
              const newEdges = getRouteEdges(newRoute);
              const overlap = currentEdges.filter((e) => newEdges.includes(e)).length;
              const divergence = 1 - overlap / Math.max(1, currentEdges.length);

              if (divergence > 0.3) {
                // Apply new accident if we have more scenarios
                const nextIdx = (updates.nextAccidentIdx ?? state.nextAccidentIdx);
                if (nextIdx < ACCIDENT_SCENARIOS.length) {
                  const scenario = ACCIDENT_SCENARIOS[nextIdx];
                  applyAccidentToGraph(graph, scenario);
                  const accidents = [...(updates.activeAccidents ?? state.activeAccidents), { scenario, time: newTime }];
                  updates.graph = graph;
                  updates.activeAccidents = accidents;
                  updates.allBlockedEdges = rebuildBlockedSet(graph);
                  updates.nextAccidentIdx = nextIdx + 1;
                }

                // Build displays for all routes found
                const routeDisplays = buildRouteDisplays(routes, state.activeRouteId);
                if (routeDisplays.length > 0) routeDisplays[0].isRecommended = true;
                updates.altRoutes = routeDisplays;
                updates.activeRouteId = routeDisplays[0]?.id ?? "ROUTE_OPTIMAL";

                updates.ambulance = {
                  ...amb,
                  currentRoute: newRoute,
                  progress: 0,
                  speed: 50,
                };
                updates.trafficCorridor = sampleRoutePositions(newRoute, graph);
                updates.corridorActive = true;
                updates.rerouteCooldown = 1.5; // prevent rapid reroutes
                updates.cameraState = { state: "NORMAL ROAD" };
              }
            }
          }
        } else {
          updates.rerouteCooldown = 0.5; // check again in 0.5s
        }
      } else {
        updates.rerouteCooldown = cooldown;
      }
    }

    // ── Move ambulance ──────────────────────────────────────────────
    const amb = { ...(updates.ambulance ?? state.ambulance) };
    const cp = (updates.phase ?? state.phase) as SimPhase;

    const canMove =
      amb.speed > 0 &&
      amb.progress < 1 &&
      (cp === "departing" ||
        cp === "enroute" ||
        cp === "rerouted" ||
        cp === "enroute_alt" ||
        cp === "hospital");

    if (canMove) {
      let speedMult = 1;
      if (cp === "departing") speedMult = 0.6;
      if (cp === "hospital") speedMult = 0.4;
      if (cp === "enroute" && (updates.accident ?? state.accident).active) speedMult = 0.3;

      const progressInc = AMBULANCE_SPEED * speedMult * dt;
      amb.progress = Math.min(1, amb.progress + progressInc);

      const posResult = getPositionOnPath(
        updates.graph ?? state.graph,
        amb.currentRoute,
        amb.progress,
      );
      if (posResult) {
        amb.position = posResult.position;
        amb.angle = posResult.angle;
      }

      if (cp === "enroute_alt") amb.speed = 50;
      else if (cp === "rerouted") amb.speed = 55;
      else if (cp === "hospital") amb.speed = 25;
      else amb.speed = 60;
    }

    updates.ambulance = amb;

    // ── Edge processing animation ───────────────────────────────────
    if (cp === "detecting" || cp === "analyzing") {
      const steps = [...(updates.edgeSteps ?? state.edgeSteps)];
      const t = updates.timeElapsed ?? newTime;
      if (t > 0.3) steps[0] = { ...steps[0], active: true };
      if (t > 0.8) { steps[0] = { ...steps[0], done: true }; steps[1] = { ...steps[1], active: true }; }
      if (t > 1.5) { steps[1] = { ...steps[1], done: true }; steps[2] = { ...steps[2], active: true }; }
      if (t > 2.0) { steps[2] = { ...steps[2], done: true }; steps[3] = { ...steps[3], active: true }; }
      if (t > 2.4) steps[3] = { ...steps[3], done: true };
      updates.edgeSteps = steps;
    }

    set(updates);
  },
}));
