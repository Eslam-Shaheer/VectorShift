// ui.js — the pipeline canvas (ReactFlow), styled from tokens.

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
} from 'reactflow';
import { Undo2, Redo2, LayoutGrid, Trash } from 'lucide-react';
import { useStore } from '@/store';
import { shallow } from 'zustand/shallow';
import { nodeTypes } from '@/nodes/nodeTypes';
import { ButtonEdge } from './ButtonEdge';
import { NodeContextMenu, PaneContextMenu } from './ContextMenu';
import { ConnectionDropMenu } from './ConnectionDropMenu';
import { ConnectionLine } from './ConnectionLine';

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
  isValidConnection: state.isValidConnection,
  undo: state.undo,
  redo: state.redo,
  copySelected: state.copySelected,
  paste: state.paste,
  duplicateNode: state.duplicateNode,
  autoLayout: state.autoLayout,
  clear: state.clear,
  canUndo: state.past.length > 0,
  canRedo: state.future.length > 0,
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

const isTypingTarget = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export const Canvas = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [menu, setMenu] = useState(null); // { x, y, nodeId? }
  const [drop, setDrop] = useState(null); // pending "+"-drag drop on empty pane
  const connectingFrom = useRef(null); // { nodeId, handleId } during a "+" drag
  const store = useStore(selector, shallow);
  const { nodes, edges } = store;

  // Track which source handle a connection drag started from.
  const onConnectStart = useCallback((_e, { nodeId, handleId }) => {
    connectingFrom.current = { nodeId, handleId };
  }, []);

  // If the drag ends on empty canvas (not a node/handle), open the picker at the
  // drop point to create a node already wired to the source — n8n behavior.
  const onConnectEnd = useCallback(
    (event) => {
      const from = connectingFrom.current;
      connectingFrom.current = null;
      if (!from) return;
      const droppedOnPane = event.target?.classList?.contains('react-flow__pane');
      if (!droppedOnPane) return; // landed on a node/handle → normal onConnect

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const flowPosition = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      setDrop({
        x: event.clientX,
        y: event.clientY,
        flowPosition,
        sourceId: from.nodeId,
        sourceHandle: from.handleId,
      });
    },
    [reactFlowInstance]
  );

  const getInitNodeData = (nodeID, type) => ({ id: nodeID, nodeType: `${type}` });

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;
        if (!type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        const nodeID = store.getNodeID(type);
        store.addNode({ id: nodeID, type, position, data: getInitNodeData(nodeID, type) });
      }
    },
    [reactFlowInstance, store]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Keyboard shortcuts — inert while typing in a field.
  useEffect(() => {
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        e.shiftKey ? store.redo() : store.undo();
      } else if (key === 'y') {
        e.preventDefault();
        store.redo();
      } else if (key === 'c') {
        store.copySelected();
      } else if (key === 'v') {
        store.paste();
      } else if (key === 'd') {
        e.preventDefault();
        nodes.filter((n) => n.selected).forEach((n) => store.duplicateNode(n.id));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store, nodes]);

  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      {nodes.length === 0 && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={store.onNodesChange}
        onEdgesChange={store.onEdgesChange}
        onConnect={store.onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={store.isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={(inst) => {
          setReactFlowInstance(inst);
          setTimeout(() => inst.fitView({ padding: 0.25, duration: 300 }), 0);
        }}
        onNodeContextMenu={(e, node) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
        }}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onPaneClick={closeMenu}
        onMoveStart={closeMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineComponent={ConnectionLine}
        defaultEdgeOptions={{ type: 'button' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1.5} color="var(--color-vs-canvas-dot)" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!bg-vs-surface-sunk"
          maskColor="transparent"
          nodeColor="var(--color-vs-handle)"
          nodeStrokeColor="var(--color-vs-border-strong)"
        />

        <Panel position="top-right" className="flex gap-1">
          <PanelButton title="Undo (⌘Z)" onClick={store.undo} disabled={!store.canUndo}>
            <Undo2 size={15} />
          </PanelButton>
          <PanelButton title="Redo (⌘⇧Z)" onClick={store.redo} disabled={!store.canRedo}>
            <Redo2 size={15} />
          </PanelButton>
          <PanelButton
            title="Auto-layout"
            onClick={() => {
              store.autoLayout();
              setTimeout(() => reactFlowInstance?.fitView({ padding: 0.25, duration: 300 }), 60);
            }}
            disabled={!nodes.length}
          >
            <LayoutGrid size={15} />
          </PanelButton>
          <PanelButton title="Clear canvas" onClick={store.clear} disabled={!nodes.length}>
            <Trash size={15} />
          </PanelButton>
        </Panel>
      </ReactFlow>

      {menu &&
        (menu.nodeId ? (
          <NodeContextMenu {...menu} onClose={closeMenu} />
        ) : (
          <PaneContextMenu {...menu} onClose={closeMenu} />
        ))}

      {drop && <ConnectionDropMenu drop={drop} onClose={() => setDrop(null)} />}
    </div>
  );
};

function PanelButton({ title, onClick, disabled, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-vs-border bg-vs-surface text-vs-body shadow-(--shadow-btn) transition-colors hover:bg-vs-surface-sunk hover:text-vs-ink disabled:opacity-40 disabled:hover:bg-vs-surface"
    >
      {children}
    </button>
  );
}
