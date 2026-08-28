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

export interface AmbulanceAccident {
  position: Vec2;
  time: number;
  recoverRoute: string[] | null;
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
  ambulanceAccident: AmbulanceAccident | null;

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
  ambAccidentTimer: number; // countdown for ambulance accident stop
  maxReroutes: number; // prevent infinite loops
  rerouteCount: number;

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
  position: { x: 32, z: 0 },
  angle: Math.PI, // facing west (toward JC/JA)
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

// Distance between two Vec2 points
function distBetween(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Check if the ambulance is approaching an accident (within PROXIMITY_THRESHOLD)
// and hasn't already been detected as passed.
const PROXIMITY_THRESHOLD = 6; // units — how close before ambulance "hits" accident

function isAmbulanceNearAccident(
  ambPos: Vec2,
  ambRoute: string[],
  ambProgress: number,
  accidents: ActiveAccident[],
  graph: CityGraph,
): boolean {
  if (accidents.length === 0) return false;
  const totalEdges = ambRoute.length - 1;
  const currentEdgeIdx = Math.floor(ambProgress * totalEdges);
  // Check current edge and next 2 edges ahead
  for (let i = currentEdgeIdx; i < Math.min(currentEdgeIdx + 3, totalEdges); i++) {
    const a = graph.nodes.get(ambRoute[i])?.position;
    const b = graph.nodes.get(ambRoute[i + 1])?.position;
    if (!a || !b) continue;
    for (const acc of accidents) {
      // Check distance from accident position to the road segment
      const segDx = b.x - a.x;
      const segDz = b.z - a.z;
      const segLen = Math.sqrt(segDx * segDx + segDz * segDz);
      if (segLen === 0) continue;
      // Project accident onto segment, clamp to [0,1]
      const t = Math.max(0, Math.min(1, ((acc.scenario.position.x - a.x) * segDx + (acc.scenario.position.z - a.z) * segDz) / (segLen * segLen)));
      const closestX = a.x + t * segDx;
      const closestZ = a.z + t * segDz;
      const dist = distBetween(acc.scenario.position, { x: closestX, z: closestZ });
      if (dist < PROXIMITY_THRESHOLD) {
        // Also check the ambulance hasn't already passed (progress beyond the segment)
        if (ambProgress * totalEdges < i + 0.9) return true;
      }
    }
  }
  return false;
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
  ambAccidentTimer: 0,
  maxReroutes: 5,
  rerouteCount: 0,
  ambulanceAccident: null,

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
      ambAccidentTimer: 0,
      maxReroutes: 5,
      rerouteCount: 0,
      ambulanceAccident: null,
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
      ambAccidentTimer: 0,
      maxReroutes: 5,
      rerouteCount: 0,
      ambulanceAccident: null,
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

    // ── Ambulance accident detection ────────────────────────────────
    const cp = (updates.phase ?? state.phase) as SimPhase;
    const ambForDetect = { ...(updates.ambulance ?? state.ambulance) };
    const accForDetect = updates.activeAccidents ?? state.activeAccidents;
    const ambAccTimer = (updates.ambulanceAccident ?? state.ambulanceAccident)?.time
      ? (updates.ambulanceAccident ?? state.ambulanceAccident)!.time - dt
      : 0;

    // If ambulance is in accident recovery, handle the timer
    if ((updates.ambulanceAccident ?? state.ambulanceAccident) && ambAccTimer > 0) {
      updates.ambulanceAccident = {
        ...(updates.ambulanceAccident ?? state.ambulanceAccident)!,
        time: ambAccTimer,
      };
      // Keep ambulance stopped during recovery
      updates.ambulance = {
        ...(updates.ambulance ?? state.ambulance),
        speed: 0,
      };
    } else if (
      (updates.ambulanceAccident ?? state.ambulanceAccident) &&
      (updates.ambulanceAccident ?? state.ambulanceAccident)!.time <= 0
    ) {
      // Recovery timer done — apply the recover route
      const ambAcc = (updates.ambulanceAccident ?? state.ambulanceAccident)!;
      if (ambAcc.recoverRoute && ambAcc.recoverRoute.length >= 2) {
        const newRoute = ambAcc.recoverRoute;
        const currentEdges = getRouteEdges(ambForDetect.currentRoute);
        const newEdges = getRouteEdges(newRoute);
        const overlap = currentEdges.filter((e) => newEdges.includes(e)).length;
        const divergence = 1 - overlap / Math.max(1, currentEdges.length);
        if (divergence > 0.2) {
          updates.ambulance = {
            ...(updates.ambulance ?? state.ambulance),
            currentRoute: newRoute,
            progress: 0,
            speed: 50,
          };
          updates.trafficCorridor = sampleRoutePositions(newRoute, updates.graph ?? state.graph);
          updates.corridorActive = true;
        }
      }
      updates.ambulanceAccident = null;
      updates.cameraState = { state: "NORMAL ROAD" };
      // Build route displays so HUD shows alternatives
      const nearestNode = findNearestNode(updates.graph ?? state.graph, ambForDetect.position);
      const routes = findAlternativeRoutes(updates.graph ?? state.graph, nearestNode, "HOSPITAL", 5);
      const routeDisplays = buildRouteDisplays(routes, state.activeRouteId);
      if (routeDisplays.length > 0) routeDisplays[0].isRecommended = true;
      updates.altRoutes = routeDisplays;
    } else if (
      cp === "enroute" || cp === "enroute_alt"
    ) {
      // Check if ambulance is approaching an accident
      const graph = updates.graph ?? state.graph;
      const nearAccident = isAmbulanceNearAccident(
        ambForDetect.position,
        ambForDetect.currentRoute,
        ambForDetect.progress,
        accForDetect,
        graph,
      );

      if (nearAccident) {
        // AMBULANCE ACCIDENT — stop and reroute
        const nearestNode = findNearestNode(graph, ambForDetect.position);
        const routes = findAlternativeRoutes(graph, nearestNode, "HOSPITAL", 5);

        // Pick the best route that isn't the current one
        let bestRoute: string[] | null = null;
        for (const r of routes) {
          const newEdges = getRouteEdges(r.path);
          const currentEdges = getRouteEdges(ambForDetect.currentRoute);
          const overlap = currentEdges.filter((e) => newEdges.includes(e)).length;
          const divergence = 1 - overlap / Math.max(1, currentEdges.length);
          if (divergence > 0.2) {
            bestRoute = [nearestNode, ...r.path.slice(r.path.indexOf(nearestNode) + 1)];
            break;
          }
        }
        if (!bestRoute && routes.length > 0) {
          bestRoute = [nearestNode, ...routes[0].path.slice(routes[0].path.indexOf(nearestNode) + 1)];
        }

        updates.ambulanceAccident = {
          position: { ...ambForDetect.position },
          time: 2.0, // 2 second stop
          recoverRoute: bestRoute,
        };
        updates.ambulance = {
          ...(updates.ambulance ?? state.ambulance),
          speed: 0,
        };
        updates.cameraState = { state: "ACCIDENT DETECTED" };
        updates.rerouteCount = (updates.rerouteCount ?? state.rerouteCount) + 1;
        // Build displays so HUD shows alternatives
        const routeDisplays = buildRouteDisplays(routes, state.activeRouteId);
        if (routeDisplays.length > 0) routeDisplays[0].isRecommended = true;
        updates.altRoutes = routeDisplays;
      }
    }

    // ── Move ambulance ──────────────────────────────────────────────
    const amb = { ...(updates.ambulance ?? state.ambulance) };

    const canMove =
      amb.speed > 0 &&
      amb.progress < 1 &&
      !(updates.ambulanceAccident ?? state.ambulanceAccident) &&
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
