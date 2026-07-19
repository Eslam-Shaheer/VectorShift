// ui.js — the pipeline canvas (ReactFlow), styled from tokens.

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { nodeTypes } from './nodes/nodeTypes';
import { ButtonEdge } from './nodes/ButtonEdge';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const edgeTypes = { button: ButtonEdge };

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center">
      <span className="vs-eyebrow">Empty canvas</span>
      <p className="max-w-xs text-lg text-vs-muted">
        Drag a node from the left to <span className="vs-em text-vs-ink">begin</span>.
      </p>
    </div>
  );
}

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { nodes, edges, getNodeID, addNode, onNodesChange, onEdgesChange, onConnect } =
    useStore(selector, shallow);

  const getInitNodeData = (nodeID, type) => ({ id: nodeID, nodeType: `${type}` });

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;
        if (typeof type === 'undefined' || !type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        addNode({ id: nodeID, type, position, data: getInitNodeData(nodeID, type) });
      }
    },
    [reactFlowInstance, addNode, getNodeID]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      {nodes.length === 0 && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineType="bezier"
        defaultEdgeOptions={{ type: 'button' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1.5} color="var(--color-vs-canvas-dot)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
