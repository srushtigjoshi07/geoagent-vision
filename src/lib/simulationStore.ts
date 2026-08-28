import { create } from "zustand";
import {
  buildGraph,
  dijkstra,
  getPositionOnPath,
  type CityGraph,
  type Vec2,
  PRIMARY_ROUTE,
  calculateAltRoutes,
  type AltRoute,
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

export interface AccidentInfo {
  position: Vec2;
  active: boolean;
  detected: boolean;
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
  accident: AccidentInfo;

  primaryRoute: string[];
  altRoutes: RouteDisplay[];
  activeRouteId: string;

  trajectoryAgent: AgentStatus;
  incidentAgent: AgentStatus;
  routeAgent: AgentStatus;
  decisionAgent: AgentStatus;

  cameraState: CameraState;
  edgeSteps: EdgeProcessingStep[];
  timeline: TimelineStep[];
  graph: CityGraph;

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
    { id: "departed",   label: "DEPARTED",     active: false, done: false },
    { id: "accident",   label: "ACCIDENT",     active: false, done: false },
    { id: "detected",   label: "DETECTED",     active: false, done: false },
    { id: "analyzed",   label: "ANALYZED",     active: false, done: false },
    { id: "route_selected", label: "ROUTE SELECTED", active: false, done: false },
    { id: "rerouted",   label: "REROUTED",     active: false, done: false },
    { id: "hospital",   label: "HOSPITAL",     active: false, done: false },
  ];
}

function createEdgeSteps(): EdgeProcessingStep[] {
  return [
    { label: "CAMERA FRAME",        active: false, done: false },
    { label: "RASPBERRY PI",        active: false, done: false },
    { label: "VISION PROCESSING",   active: false, done: false },
    { label: "INCIDENT DETECTED",   active: false, done: false },
  ];
}

const PHASE_DURATIONS: Partial<Record<SimPhase, number>> = {
  departing: 2,
  enroute: 6,
  accident: 2,
  traffic: 3,
  detecting: 2.5,
  analyzing: 2.5,
  rerouting: 2.5,
  rerouted: 1.5,
  enroute_alt: 5,
  hospital: 2,
};

const PHASE_ORDER: SimPhase[] = [
  "departing", "enroute", "accident", "traffic",
  "detecting", "analyzing", "rerouting", "rerouted",
  "enroute_alt", "hospital", "completed",
];

const AMBULANCE_SPEED = 0.12;

function congestGraph(): CityGraph {
  const graph = buildGraph();
  for (const e of graph.edges) {
    if (
      (e.from === "JB" && (e.to === "JC" || e.to === "JA")) ||
      (e.to === "JB" && (e.from === "JC" || e.from === "JA"))
    ) {
      e.isCongested = true;
    }
  }
  return graph;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  phase: "idle",
  isPaused: false,
  timeElapsed: 0,

  ambulance: { ...INITIAL_AMBULANCE, currentRoute: [...PRIMARY_ROUTE] },
  accident: { position: { x: 0, z: 0 }, active: false, detected: false },

  primaryRoute: [...PRIMARY_ROUTE],
  altRoutes: [],
  activeRouteId: "PRIMARY",

  trajectoryAgent: "idle",
  incidentAgent: "idle",
  routeAgent: "idle",
  decisionAgent: "idle",

  cameraState: { state: "NORMAL ROAD" },
  edgeSteps: createEdgeSteps(),
  timeline: createTimeline(),
  graph: buildGraph(),

  startDemo: () => {
    const graph = buildGraph();
    set({
      phase: "departing",
      isPaused: false,
      timeElapsed: 0,
      ambulance: { ...INITIAL_AMBULANCE, currentRoute: [...PRIMARY_ROUTE] },
      accident: { position: { x: 0, z: 0 }, active: false, detected: false },
      primaryRoute: [...PRIMARY_ROUTE],
      altRoutes: [],
      activeRouteId: "PRIMARY",
      trajectoryAgent: "active",
      incidentAgent: "idle",
      routeAgent: "idle",
      decisionAgent: "idle",
      cameraState: { state: "NORMAL ROAD" },
      edgeSteps: createEdgeSteps(),
      timeline: createTimeline(),
      graph,
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
      primaryRoute: [...PRIMARY_ROUTE],
      altRoutes: [],
      activeRouteId: "PRIMARY",
      trajectoryAgent: "idle",
      incidentAgent: "idle",
      routeAgent: "idle",
      decisionAgent: "idle",
      cameraState: { state: "NORMAL ROAD" },
      edgeSteps: createEdgeSteps(),
      timeline: createTimeline(),
      graph: buildGraph(),
    }),

  triggerAccident: () => {
    const state = get();
    if (state.phase === "idle" || state.phase === "completed") return;
    set({
      phase: "accident",
      accident: { position: { x: 0, z: 0 }, active: true, detected: false },
      cameraState: { state: "ACCIDENT DETECTED" },
    });
  },

  triggerTraffic: () => {
    const s = get();
    if (!s.accident.active) return;
    set({
      phase: "traffic",
      graph: congestGraph(),
      cameraState: { state: "ROAD BLOCKED" },
    });
  },

  clearIncident: () => {
    set({
      accident: { position: { x: 0, z: 0 }, active: false, detected: false },
      graph: buildGraph(),
      cameraState: { state: "NORMAL ROAD" },
    });
  },

  tick: (dt: number) => {
    const state = get();
    if (state.isPaused || state.phase === "idle" || state.phase === "completed") return;

    const newTime = state.timeElapsed + dt;
    const duration = PHASE_DURATIONS[state.phase];
    const updates: Partial<SimulationState> = { timeElapsed: newTime };

    let nextPhase: SimPhase = state.phase;

    if (duration && newTime > duration) {
      const idx = PHASE_ORDER.indexOf(state.phase);
      if (idx >= 0 && idx < PHASE_ORDER.length - 1) {
        nextPhase = PHASE_ORDER[idx + 1];
        updates.phase = nextPhase;
      }

      // Phase-specific transitions
      switch (nextPhase) {
        case "enroute": {
          updates.cameraState = { state: "NORMAL ROAD" };
          break;
        }
        case "accident": {
          updates.accident = { position: { x: 0, z: 0 }, active: true, detected: false };
          updates.cameraState = { state: "ACCIDENT DETECTED" };
          const tl = [...state.timeline];
          const ti = tl.findIndex((t) => t.id === "accident");
          if (ti >= 0) tl[ti].done = true;
          updates.timeline = tl;
          break;
        }
        case "traffic": {
          updates.graph = congestGraph();
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
          const graph = congestGraph();
          const alts = calculateAltRoutes(graph);
          const routeDisplays: RouteDisplay[] = alts.map((r) => ({
            ...r,
            visible: true,
          }));
          updates.graph = graph;
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
            updates.ambulance = {
              ...state.ambulance,
              currentRoute: [...rec.path],
              progress: 0,
              speed: 50,
            };
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
          // Let the ambulance keep moving at slow speed to reach the hospital
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
          break;
        }
      }
    }

    // Move ambulance
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
      if (cp === "enroute" && state.accident.active) speedMult = 0.3;

      const progressInc = AMBULANCE_SPEED * speedMult * dt;
      amb.progress = Math.min(1, amb.progress + progressInc);

      const posResult = getPositionOnPath(
        updates.graph ?? state.graph,
        amb.currentRoute,
        amb.progress
      );
      if (posResult) {
        amb.position = posResult.position;
        amb.angle = posResult.angle;
      }

      // Override speed for specific phases
      if (cp === "enroute_alt") amb.speed = 50;
      else if (cp === "rerouted") amb.speed = 55;
      else if (cp === "hospital") amb.speed = 25;
      else amb.speed = 60;
    }

    updates.ambulance = amb;

    // Edge processing animation
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
