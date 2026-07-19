// store.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { nodeRegistry } from '@/nodes/registry';
import { firstHandle, layoutGraph } from '@/lib/graph';

// Single source of truth for edge appearance, shared by manual connects, "+"
// quick-add and edge-insert so every edge looks identical.
const makeEdge = (connection) => ({
  ...connection,
  type: 'button',
  markerEnd: { type: MarkerType.ArrowClosed, height: 16, width: 16 },
});

const MAX_HISTORY = 50;

export const useStore = create(
  persist(
    (set, get) => {
      // Push the current graph onto the undo stack before a structural change.
      // Field edits and drag *streams* are intentionally excluded (see callers).
      const snapshot = () => {
        const { nodes, edges, nodeIDs } = get();
        const past = [...get().past, { nodes, edges, nodeIDs }].slice(-MAX_HISTORY);
        set({ past, future: [] });
      };

      return {
        nodes: [],
        edges: [],
        nodeIDs: {},
        past: [],
        future: [],
        clipboard: [],

        getNodeID: (type) => {
          const newIDs = { ...get().nodeIDs };
          if (newIDs[type] === undefined) newIDs[type] = 0;
          newIDs[type] += 1;
          set({ nodeIDs: newIDs });
          return `${type}-${newIDs[type]}`;
        },

        addNode: (node) => {
          snapshot();
          set({ nodes: [...get().nodes, node] });
        },

        // "+" quick-add: new node to the right of `sourceId`, wired to its first
        // target handle.
        // Add a node wired to `sourceHandle`. `position` (flow coords) places it
        // exactly — used when the user drags the "+" and drops on empty canvas
        // (n8n style); omit it and the node lands to the right of the source.
        addConnectedNode: ({ sourceId, sourceHandle, type, position }) => {
          const state = get();
          const source = state.nodes.find((n) => n.id === sourceId);
          if (!nodeRegistry[type]) return;

          snapshot();
          const newId = state.getNodeID(type);
          const width = source?.width ?? nodeRegistry[source?.type]?.width ?? 260;
          const pos = position ?? {
            x: (source?.position?.x ?? 0) + width + 120,
            y: source?.position?.y ?? 0,
          };
          const newNode = { id: newId, type, position: pos, data: { id: newId, nodeType: type } };
          set({ nodes: [...get().nodes, newNode] });

          const target = firstHandle(type, 'target');
          if (target) {
            set({
              edges: addEdge(
                makeEdge({
                  source: sourceId,
                  sourceHandle,
                  target: newId,
                  targetHandle: `${newId}-${target.id}`,
                }),
                get().edges
              ),
            });
          }
        },

        // Edge-insert: drop a node onto an existing edge, splitting it in two.
        insertNodeOnEdge: ({ edgeId, type }) => {
          const state = get();
          const edge = state.edges.find((e) => e.id === edgeId);
          if (!edge || !nodeRegistry[type]) return;
          const target = firstHandle(type, 'target');
          const source = firstHandle(type, 'source');
          if (!target || !source) return;

          snapshot();
          const newId = state.getNodeID(type);
          const a = state.nodes.find((n) => n.id === edge.source);
          const b = state.nodes.find((n) => n.id === edge.target);
          const position = {
            x: ((a?.position?.x ?? 0) + (b?.position?.x ?? 0)) / 2,
            y: ((a?.position?.y ?? 0) + (b?.position?.y ?? 0)) / 2,
          };
          const newNode = { id: newId, type, position, data: { id: newId, nodeType: type } };

          const rest = state.edges.filter((e) => e.id !== edgeId);
          const wired = addEdge(
            makeEdge({
              source: newId,
              sourceHandle: `${newId}-${source.id}`,
              target: edge.target,
              targetHandle: edge.targetHandle,
            }),
            addEdge(
              makeEdge({
                source: edge.source,
                sourceHandle: edge.sourceHandle,
                target: newId,
                targetHandle: `${newId}-${target.id}`,
              }),
              rest
            )
          );
          set({ nodes: [...state.nodes, newNode], edges: wired });
        },

        duplicateNode: (id) => {
          const node = get().nodes.find((n) => n.id === id);
          if (!node) return;
          snapshot();
          const newId = get().getNodeID(node.type);
          const clone = {
            ...node,
            id: newId,
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            data: { ...node.data, id: newId },
            selected: false,
          };
          set({ nodes: [...get().nodes, clone] });
        },

        copySelected: () => {
          const selected = get().nodes.filter((n) => n.selected);
          set({ clipboard: selected.map((n) => ({ ...n, data: { ...n.data } })) });
        },

        paste: () => {
          const clip = get().clipboard;
          if (!clip.length) return;
          snapshot();
          const created = clip.map((n) => {
            const newId = get().getNodeID(n.type);
            return {
              ...n,
              id: newId,
              position: { x: n.position.x + 48, y: n.position.y + 48 },
              data: { ...n.data, id: newId },
              selected: false,
            };
          });
          set({ nodes: [...get().nodes, ...created] });
        },

        // Transient "+" drag state (screen coords) — drives the LinkingOverlay so
        // the line always originates at the point, even when grabbed by the "+".
        linking: null,
        startLinking: (payload) => set({ linking: payload }),
        moveLinking: (toX, toY) => {
          const l = get().linking;
          if (l) set({ linking: { ...l, toX, toY } });
        },
        finishLinking: () => set({ linking: null }),

        removeNode: (id) => {
          snapshot();
          set({
            nodes: get().nodes.filter((n) => n.id !== id),
            edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          });
        },

        removeEdge: (id) => {
          snapshot();
          set({ edges: get().edges.filter((e) => e.id !== id) });
        },

        onNodesChange: (changes) => {
          // Snapshot once when a drag finishes (not on every position tick) or a
          // node is removed via keyboard, so one undo reverts one gesture.
          const commit = changes.some(
            (c) => (c.type === 'position' && c.dragging === false) || c.type === 'remove'
          );
          if (commit) snapshot();
          set({ nodes: applyNodeChanges(changes, get().nodes) });
        },

        onEdgesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) snapshot();
          set({ edges: applyEdgeChanges(changes, get().edges) });
        },

        onConnect: (connection) => {
          snapshot();
          set({ edges: addEdge(makeEdge(connection), get().edges) });
        },

        // Block self-loops and a second edge into an already-filled target handle.
        isValidConnection: (c) => {
          if (c.source === c.target) return false;
          return !get().edges.some(
            (e) => e.target === c.target && e.targetHandle === c.targetHandle
          );
        },

        updateNodeField: (nodeId, fieldName, fieldValue) => {
          set({
            nodes: get().nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
                : node
            ),
          });
        },

        autoLayout: () => {
          snapshot();
          set({ nodes: layoutGraph(get().nodes, get().edges) });
        },

        undo: () => {
          const { past, nodes, edges, nodeIDs } = get();
          if (!past.length) return;
          const prev = past[past.length - 1];
          set({
            past: past.slice(0, -1),
            future: [{ nodes, edges, nodeIDs }, ...get().future].slice(0, MAX_HISTORY),
            ...prev,
          });
        },

        redo: () => {
          const { future, nodes, edges, nodeIDs } = get();
          if (!future.length) return;
          const next = future[0];
          set({
            future: future.slice(1),
            past: [...get().past, { nodes, edges, nodeIDs }].slice(-MAX_HISTORY),
            ...next,
          });
        },

        clear: () => {
          snapshot();
          set({ nodes: [], edges: [] });
        },
      };
    },
    {
      name: 'vectorshift-pipeline',
      // Persist only the graph + id counter — never history/clipboard.
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges, nodeIDs: s.nodeIDs }),
    }
  )
);
