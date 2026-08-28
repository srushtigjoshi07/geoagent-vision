// City road graph for GeoAgent Vision simulation
// Nodes are intersections; edges are road segments with travel cost

export interface Vec2 {
  x: number;
  z: number;
}

export interface CityNode {
  id: string;
  label: string;
  position: Vec2;
}

export interface CityEdge {
  from: string;
  to: string;
  baseCost: number; // travel time in "minutes"
  isCongested: boolean;
  isBlocked: boolean;
}

export interface CityGraph {
  nodes: Map<string, CityNode>;
  edges: CityEdge[];
}

// ── City layout ───────────────────────────────────────────────────────
// Isometric grid: X axis ≈ east-west, Z axis ≈ north-south
// Base is west, Hospital is east

export const CITY_NODES: CityNode[] = [
  { id: "BASE",       label: "Emergency Base",      position: { x: -40, z: 0   } },
  { id: "JA",         label: "Junction A",           position: { x: -20, z: 0   } },
  { id: "JB",         label: "Junction B",           position: { x:   0, z: 0   } },
  { id: "JC",         label: "Junction C",           position: { x:  20, z: 0   } },
  { id: "HOSPITAL",   label: "Hospital",             position: { x:  40, z: 0   } },
  // Alt-route nodes (north)
  { id: "N1",         label: "North Gate",           position: { x: -20, z: -18 } },
  { id: "N2",         label: "North Mid",            position: { x:   0, z: -18 } },
  { id: "N3",         label: "North East",           position: { x:  20, z: -18 } },
  // Alt-route nodes (south)
  { id: "S1",         label: "South Gate",           position: { x: -20, z:  18 } },
  { id: "S2",         label: "South Mid",            position: { x:   0, z:  18 } },
  { id: "S3",         label: "South East",           position: { x:  20, z:  18 } },
  // Extra connector nodes
  { id: "N0",         label: "North West",           position: { x: -30, z: -10 } },
  { id: "S0",         label: "South West",           position: { x: -30, z:  10 } },
  { id: "N4",         label: "North Hospital",       position: { x:  32, z: -10 } },
  { id: "S4",         label: "South Hospital",       position: { x:  32, z:  10 } },
];

export const CITY_EDGES: CityEdge[] = [
  // Main east-west corridor (primary route)
  { from: "BASE",   to: "JA",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JA",     to: "JB",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JB",     to: "JC",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JC",     to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },

  // North corridor
  { from: "BASE",   to: "N0",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N0",     to: "N1",   baseCost: 2, isCongested: false, isBlocked: false },
  { from: "N1",     to: "N2",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N2",     to: "N3",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N3",     to: "N4",   baseCost: 2, isCongested: false, isBlocked: false },
  { from: "N4",     to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },

  // South corridor
  { from: "BASE",   to: "S0",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S0",     to: "S1",   baseCost: 2, isCongested: false, isBlocked: false },
  { from: "S1",     to: "S2",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S2",     to: "S3",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S3",     to: "S4",   baseCost: 2, isCongested: false, isBlocked: false },
  { from: "S4",     to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },

  // N-S connectors (vertical)
  { from: "JA",     to: "N1",   baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JB",     to: "N2",   baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JC",     to: "N3",   baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JA",     to: "S1",   baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JB",     to: "S2",   baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JC",     to: "S3",   baseCost: 4, isCongested: false, isBlocked: false },

  // Diagonal connectors
  { from: "N0",     to: "JA",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S0",     to: "JA",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N3",     to: "JC",   baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S3",     to: "JC",   baseCost: 3, isCongested: false, isBlocked: false },
];

// ── Build adjacency list ──────────────────────────────────────────────
export function buildGraph(): CityGraph {
  const nodes = new Map<string, CityNode>();
  for (const n of CITY_NODES) nodes.set(n.id, n);
  const edges = CITY_EDGES.map(e => ({ ...e })); // clone
  return { nodes, edges };
}

// ── Dijkstra shortest path ────────────────────────────────────────────
export interface PathResult {
  path: string[];
  totalCost: number;
}

export function dijkstra(graph: CityGraph, startId: string, endId: string): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const [id] of graph.nodes) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(startId, 0);

  // Build adjacency: bidirectional edges
  const adj = new Map<string, { to: string; cost: number }[]>();
  for (const [id] of graph.nodes) adj.set(id, []);
  for (const e of graph.edges) {
    if (e.isBlocked) continue;
    const cost = e.isCongested ? e.baseCost * 4 : e.baseCost;
    adj.get(e.from)!.push({ to: e.to, cost });
    adj.get(e.to)!.push({ to: e.from, cost });
  }

  while (true) {
    // Pick unvisited node with smallest dist
    let u: string | null = null;
    let minD = Infinity;
    for (const [id] of graph.nodes) {
      if (!visited.has(id) && (dist.get(id) ?? Infinity) < minD) {
        minD = dist.get(id)!;
        u = id;
      }
    }
    if (u === null || u === endId) break;
    visited.add(u);

    for (const edge of adj.get(u)!) {
      const alt = (dist.get(u) ?? Infinity) + edge.cost;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  if (dist.get(endId) === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return { path, totalCost: dist.get(endId)! };
}

// ── Predefined routes for the demo ────────────────────────────────────
export const PRIMARY_ROUTE = ["BASE", "JA", "JB", "JC", "HOSPITAL"];

export interface AltRoute {
  id: string;
  label: string;
  path: string[];
  cost: number;
  isRecommended: boolean;
}

export function calculateAltRoutes(graph: CityGraph): AltRoute[] {
  const routes: AltRoute[] = [];

  // Route A: Go north — block all south connectors so the only path is via north nodes
  const routeAGraph: CityGraph = {
    nodes: graph.nodes,
    edges: graph.edges.map(e => ({
      ...e,
      isBlocked:
        e.isBlocked ||
        e.from === "JA" && e.to === "JB" ||
        e.from === "JB" && e.to === "JA" ||
        e.from === "JB" && e.to === "JC" ||
        e.from === "JC" && e.to === "JB" ||
        e.from === "BASE" && e.to === "S0" ||
        e.from === "S0" && e.to === "BASE" ||
        e.from === "JA" && e.to === "S1" ||
        e.from === "S1" && e.to === "JA" ||
        e.from === "JB" && e.to === "S2" ||
        e.from === "S2" && e.to === "JB" ||
        e.from === "JC" && e.to === "S3" ||
        e.from === "S3" && e.to === "JC",
    })),
  };
  const routeAPath = dijkstra(routeAGraph, "BASE", "HOSPITAL");
  if (routeAPath) {
    routes.push({
      id: "ROUTE_A",
      label: "Route A",
      path: routeAPath.path,
      cost: routeAPath.totalCost,
      isRecommended: false,
    });
  }

  // Route B: Go south — block all north connectors so the only path is via south nodes
  const routeBGraph: CityGraph = {
    nodes: graph.nodes,
    edges: graph.edges.map(e => ({
      ...e,
      isBlocked:
        e.isBlocked ||
        e.from === "JA" && e.to === "JB" ||
        e.from === "JB" && e.to === "JA" ||
        e.from === "JB" && e.to === "JC" ||
        e.from === "JC" && e.to === "JB" ||
        e.from === "BASE" && e.to === "N0" ||
        e.from === "N0" && e.to === "BASE" ||
        e.from === "JA" && e.to === "N1" ||
        e.from === "N1" && e.to === "JA" ||
        e.from === "JB" && e.to === "N2" ||
        e.from === "N2" && e.to === "JB" ||
        e.from === "JC" && e.to === "N3" ||
        e.from === "N3" && e.to === "JC",
    })),
  };
  const routeBPath = dijkstra(routeBGraph, "BASE", "HOSPITAL");
  if (routeBPath) {
    routes.push({
      id: "ROUTE_B",
      label: "Route B",
      path: routeBPath.path,
      cost: routeBPath.totalCost,
      isRecommended: false,
    });
  }

  // Route C: Go south with congestion on BASE→S0 (slower due to traffic)
  const routeCGraph: CityGraph = {
    nodes: graph.nodes,
    edges: graph.edges.map(e => ({
      ...e,
      isBlocked:
        e.isBlocked ||
        e.from === "JA" && e.to === "JB" ||
        e.from === "JB" && e.to === "JA" ||
        e.from === "JB" && e.to === "JC" ||
        e.from === "JC" && e.to === "JB",
      isCongested:
        e.isCongested ||
        (e.from === "BASE" && e.to === "S0") ||
        (e.from === "S0" && e.to === "BASE"),
    })),
  };
  const routeCPath = dijkstra(routeCGraph, "BASE", "HOSPITAL");
  if (routeCPath) {
    routes.push({
      id: "ROUTE_C",
      label: "Route C",
      path: routeCPath.path,
      cost: routeCPath.totalCost,
      isRecommended: false,
    });
  }

  // Mark fastest as recommended — shortest time wins
  if (routes.length > 0) {
    const fastest = routes.reduce((a, b) => (a.cost < b.cost ? a : b));
    fastest.isRecommended = true;
  }

  return routes;
}

// ── Traffic-aware re-evaluation ─────────────────────────────────────
// Given the current graph state (congestion/blocked), recalculate the
// best route from the ambulance's current node to the hospital.
export function findBestRouteFrom(
  graph: CityGraph,
  fromId: string,
): PathResult | null {
  return dijkstra(graph, fromId, "HOSPITAL");
}

// Find which graph node the ambulance is closest to
export function findNearestNode(graph: CityGraph, pos: Vec2): string {
  let best = "BASE";
  let bestDist = Infinity;
  for (const [id, node] of graph.nodes) {
    const dx = node.position.x - pos.x;
    const dz = node.position.z - pos.z;
    const d = dx * dx + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

// ── Utility: interpolate position along a path ────────────────────────
export function getPositionOnPath(
  graph: CityGraph,
  path: string[],
  progress: number // 0..1
): { position: Vec2; angle: number } | null {
  if (path.length < 2) return null;

  // Calculate total path length
  const segments: { from: Vec2; to: Vec2; length: number }[] = [];
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = graph.nodes.get(path[i])!.position;
    const b = graph.nodes.get(path[i + 1])!.position;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    segments.push({ from: a, to: b, length: len });
    totalLength += len;
  }

  const targetDist = progress * totalLength;
  let traveled = 0;

  for (const seg of segments) {
    if (traveled + seg.length >= targetDist) {
      const t = (targetDist - traveled) / seg.length;
      const px = seg.from.x + (seg.to.x - seg.from.x) * t;
      const pz = seg.from.z + (seg.to.z - seg.from.z) * t;
      const angle = Math.atan2(seg.to.x - seg.from.x, seg.to.z - seg.from.z);
      return { position: { x: px, z: pz }, angle };
    }
    traveled += seg.length;
  }

  // At the end
  const last = segments[segments.length - 1];
  const angle = Math.atan2(last.to.x - last.from.x, last.to.z - last.from.z);
  return { position: { ...last.to, }, angle };
}
