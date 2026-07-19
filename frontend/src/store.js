// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';
import { nodeRegistry } from './nodes/registry';

// Single source of truth for edge appearance, shared by manual connects and the
// n8n-style "+" quick-add so both produce identical edges.
const makeEdge = (connection) => ({
  ...connection,
  type: 'button',
  markerEnd: { type: MarkerType.ArrowClosed, height: 16, width: 16 },
});

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    // Creates a new node to the right of `sourceId` and wires the given source
    // handle to the new node's first target handle. Powers the "+" quick-add.
    addConnectedNode: ({ sourceId, sourceHandle, type }) => {
      const state = get();
      const source = state.nodes.find((n) => n.id === sourceId);
      const config = nodeRegistry[type];
      if (!config) return;

      const newId = state.getNodeID(type);
      const width = source?.width ?? nodeRegistry[source?.type]?.width ?? 260;
      const position = {
        x: (source?.position?.x ?? 0) + width + 120,
        y: source?.position?.y ?? 0,
      };
      const newNode = { id: newId, type, position, data: { id: newId, nodeType: type } };
      set({ nodes: [...state.nodes, newNode] });

      const firstTarget = (config.handles ?? []).find((h) => h.kind === 'target');
      if (firstTarget) {
        set({
          edges: addEdge(
            makeEdge({
              source: sourceId,
              sourceHandle,
              target: newId,
              targetHandle: `${newId}-${firstTarget.id}`,
            }),
            get().edges
          ),
        });
      }
    },
    // Remove a node and any edges touching it (ReactFlow won't cascade for us).
    removeNode: (id) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      });
    },
    removeEdge: (id) => {
      set({ edges: get().edges.filter((e) => e.id !== id) });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      set({
        edges: addEdge(makeEdge(connection), get().edges),
      });
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
  }));
