import Dagre from '@dagrejs/dagre';
import { nodeRegistry } from '@/nodes/registry';

// First static handle of a given kind for a node type (used to wire quick-add /
// edge-insert to sensible default ports).
export const firstHandle = (type, kind) =>
  (nodeRegistry[type]?.handles ?? []).find((h) => h.kind === kind);

export const hasHandle = (type, kind) => Boolean(firstHandle(type, kind));

// Client-side DAG check (Kahn) so the TopBar can show live graph status without
// a round-trip. Mirrors the backend's algorithm.
export function isDagClient(nodes, edges) {
  const ids = new Set(nodes.map((n) => n.id));
  const indeg = new Map([...ids].map((id) => [id, 0]));
  const adj = new Map([...ids].map((id) => [id, []]));
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) {
      adj.get(e.source).push(e.target);
      indeg.set(e.target, indeg.get(e.target) + 1);
    }
  }
  const queue = [...ids].filter((id) => indeg.get(id) === 0);
  let visited = 0;
  while (queue.length) {
    const cur = queue.shift();
    visited += 1;
    for (const nb of adj.get(cur)) {
      indeg.set(nb, indeg.get(nb) - 1);
      if (indeg.get(nb) === 0) queue.push(nb);
    }
  }
  return visited === ids.size;
}

// Left-to-right auto-layout via dagre. Uses each node's *measured* size (Text
// auto-grows) with a config/px fallback for the first frame before measurement.
export function layoutGraph(nodes, edges) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 96 });

  for (const n of nodes) {
    const width = n.width ?? nodeRegistry[n.type]?.width ?? 240;
    const height = n.height ?? 120;
    g.setNode(n.id, { width, height });
  }
  for (const e of edges) g.setEdge(e.source, e.target);

  Dagre.layout(g);

  return nodes.map((n) => {
    const { x, y, width, height } = g.node(n.id);
    // dagre positions by center; ReactFlow positions by top-left.
    return { ...n, position: { x: x - width / 2, y: y - height / 2 } };
  });
}
