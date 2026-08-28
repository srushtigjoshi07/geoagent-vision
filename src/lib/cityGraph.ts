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
  baseCost: number;
  isCongested: boolean;
  isBlocked: boolean;
}

export interface CityGraph {
  nodes: Map<string, CityNode>;
  edges: CityEdge[];
}

// ── City layout ───────────────────────────────────────────────────────

export const CITY_NODES: CityNode[] = [
  { id: "BASE",     label: "Emergency Base", position: { x: -40, z: 0   } },
  { id: "JA",       label: "Junction A",     position: { x: -20, z: 0   } },
  { id: "JB",       label: "Junction B",     position: { x:   0, z: 0   } },
  { id: "JC",       label: "Junction C",     position: { x:  20, z: 0   } },
  { id: "HOSPITAL", label: "Hospital",       position: { x:  40, z: 0   } },
  { id: "N0",       label: "North West",     position: { x: -30, z: -10 } },
  { id: "N1",       label: "North Gate",     position: { x: -20, z: -18 } },
  { id: "N2",       label: "North Mid",      position: { x:   0, z: -18 } },
  { id: "N3",       label: "North East",     position: { x:  20, z: -18 } },
  { id: "N4",       label: "North Hospital", position: { x:  32, z: -10 } },
  { id: "S0",       label: "South West",     position: { x: -30, z:  10 } },
  { id: "S1",       label: "South Gate",     position: { x: -20, z:  18 } },
  { id: "S2",       label: "South Mid",      position: { x:   0, z:  18 } },
  { id: "S3",       label: "South East",     position: { x:  20, z:  18 } },
  { id: "S4",       label: "South Hospital", position: { x:  32, z:  10 } },
];

export const CITY_EDGES: CityEdge[] = [
  // Main E-W corridor
  { from: "BASE", to: "JA",       baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JA",   to: "JB",       baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JB",   to: "JC",       baseCost: 3, isCongested: false, isBlocked: false },
  { from: "JC",   to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },
  // North corridor
  { from: "BASE", to: "N0", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N0",   to: "N1", baseCost: 2, isCongested: false, isBlocked: false },
  { from: "N1",   to: "N2", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N2",   to: "N3", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N3",   to: "N4", baseCost: 2, isCongested: false, isBlocked: false },
  { from: "N4",   to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },
  // South corridor
  { from: "BASE", to: "S0", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S0",   to: "S1", baseCost: 2, isCongested: false, isBlocked: false },
  { from: "S1",   to: "S2", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S2",   to: "S3", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S3",   to: "S4", baseCost: 2, isCongested: false, isBlocked: false },
  { from: "S4",   to: "HOSPITAL", baseCost: 3, isCongested: false, isBlocked: false },
  // N-S connectors
  { from: "JA", to: "N1", baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JB", to: "N2", baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JC", to: "N3", baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JA", to: "S1", baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JB", to: "S2", baseCost: 4, isCongested: false, isBlocked: false },
  { from: "JC", to: "S3", baseCost: 4, isCongested: false, isBlocked: false },
  // Diagonal connectors
  { from: "N0", to: "JA", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S0", to: "JA", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "N3", to: "JC", baseCost: 3, isCongested: false, isBlocked: false },
  { from: "S3", to: "JC", baseCost: 3, isCongested: false, isBlocked: false },
];

// ── Edge key utilities ────────────────────────────────────────────────

export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}->${b}` : `${b}->${a}`;
}

export function edgesForNode(nodeId: string, graph: CityGraph): CityEdge[] {
  return graph.edges.filter((e) => e.from === nodeId || e.to === nodeId);
}

// ── Build graph ───────────────────────────────────────────────────────

export function buildGraph(): CityGraph {
  const nodes = new Map<string, CityNode>();
  for (const n of CITY_NODES) nodes.set(n.id, n);
  const edges = CITY_EDGES.map((e) => ({ ...e }));
  return { nodes, edges };
}

// ── Dijkstra ──────────────────────────────────────────────────────────

export interface PathResult {
  path: string[];
  totalCost: number;
}

export function dijkstra(
  graph: CityGraph,
  startId: string,
  endId: string,
): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const [id] of graph.nodes) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(startId, 0);

  const adj = new Map<string, { to: string; cost: number }[]>();
  for (const [id] of graph.nodes) adj.set(id, []);
  for (const e of graph.edges) {
    if (e.isBlocked) continue;
    const cost = e.isCongested ? e.baseCost * 4 : e.baseCost;
    adj.get(e.from)!.push({ to: e.to, cost });
    adj.get(e.to)!.push({ to: e.from, cost });
  }

  while (true) {
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

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return { path, totalCost: dist.get(endId)! };
}

// ── Accident locations (pre-defined scenarios) ────────────────────────

export interface AccidentScenario {
  id: string;
  position: Vec2;
  blockedEdges: [string, string][];
  label: string;
}

export const ACCIDENT_SCENARIOS: AccidentScenario[] = [
  {
    id: "ACC_JB",
    position: { x: 0, z: 0 },
    blockedEdges: [
      ["JA", "JB"],
      ["JB", "JC"],
    ],
    label: "Accident at Junction B",
  },
  {
    id: "ACC_JC",
    position: { x: 20, z: 0 },
    blockedEdges: [
      ["JB", "JC"],
      ["JC", "HOSPITAL"],
    ],
    label: "Accident at Junction C",
  },
  {
    id: "ACC_N2",
    position: { x: 0, z: -18 },
    blockedEdges: [
      ["N1", "N2"],
      ["N2", "N3"],
    ],
    label: "Accident at North Mid",
  },
  {
    id: "ACC_S1",
    position: { x: -20, z: 18 },
    blockedEdges: [
      ["S0", "S1"],
      ["S1", "S2"],
    ],
    label: "Accident at South Gate",
  },
];

// ── Find alternative routes ───────────────────────────────────────────
// Returns up to `maxRoutes` distinct routes from startId to endId.
// Uses repeated Dijkstra with edge exclusion to find diverse paths.

export function findAlternativeRoutes(
  graph: CityGraph,
  startId: string,
  endId: string,
  maxRoutes: number = 4,
): PathResult[] {
  const routes: PathResult[] = [];
  const usedEdgeSets: Set<string>[] = [];

  // First route: straight Dijkstra
  const first = dijkstra(graph, startId, endId);
  if (!first) return routes;
  routes.push(first);
  usedEdgeSets.push(routeEdgeSet(first.path));

  // Subsequent routes: block edges used by previous routes
  for (let attempt = 1; attempt < maxRoutes * 3 && routes.length < maxRoutes; attempt++) {
    const blockedGraph: CityGraph = {
      nodes: graph.nodes,
      edges: graph.edges.map((e) => {
        // Block one more edge from each previous route to force diversity
        const prevRoute = routes[routes.length - 1];
        const blockIdx = attempt % Math.max(1, prevRoute.path.length - 1);
        const blockFrom = prevRoute.path[blockIdx];
        const blockTo = prevRoute.path[blockIdx + 1];
        if (!blockFrom || !blockTo) return e;
        const key = edgeKey(blockFrom, blockTo);
        const eKey = edgeKey(e.from, e.to);
        return { ...e, isBlocked: e.isBlocked || eKey === key };
      }),
    };

    const result = dijkstra(blockedGraph, startId, endId);
    if (!result) continue;

    // Check this route is sufficiently different
    const newSet = routeEdgeSet(result.path);
    if (isTooSimilar(newSet, usedEdgeSets)) continue;

    routes.push(result);
    usedEdgeSets.push(newSet);
  }

  // Sort by cost and mark best
  routes.sort((a, b) => a.totalCost - b.totalCost);
  return routes;
}

function routeEdgeSet(path: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) s.add(edgeKey(path[i], path[i + 1]));
  return s;
}

function isTooSimilar(candidate: Set<string>, existing: Set<string>[]): boolean {
  for (const prev of existing) {
    let overlap = 0;
    for (const e of candidate) if (prev.has(e)) overlap++;
    const ratio = overlap / Math.max(1, candidate.size);
    if (ratio > 0.7) return true; // too similar
  }
  return false;
}

// ── Primary route ─────────────────────────────────────────────────────

export const PRIMARY_ROUTE = ["HOSPITAL", "JC", "JB", "JA", "BASE", "JA", "JB", "JC", "HOSPITAL"];

// ── Find nearest graph node to a world position ───────────────────────

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

// ── Get the graph node IDs along a route path ─────────────────────────

export function getRouteEdges(path: string[]): string[] {
  const edges: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    edges.push(edgeKey(path[i], path[i + 1]));
  }
  return edges;
}

// ── Check if any edge on a route is blocked ───────────────────────────

export function isRouteBlocked(path: string[], graph: CityGraph): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const key = edgeKey(path[i], path[i + 1]);
    for (const e of graph.edges) {
      if (edgeKey(e.from, e.to) === key && e.isBlocked) return true;
    }
  }
  return false;
}

// ── Interpolate position along a path ─────────────────────────────────

export function getPositionOnPath(
  graph: CityGraph,
  path: string[],
  progress: number,
): { position: Vec2; angle: number } | null {
  if (path.length < 2) return null;

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

  const last = segments[segments.length - 1];
  const angle = Math.atan2(last.to.x - last.from.x, last.to.z - last.from.z);
  return { position: { ...last.to }, angle };
}
