import { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus } from 'lucide-react';
import { useStore } from '@/store';
import { hasHandle } from '@/lib/graph';
import { AddNodePicker } from './AddNodePicker';

const POSITION = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

// A right-side source output, n8n-style. There is exactly ONE ReactFlow source
// Handle per output — the circle POINT at the node edge — so edges always anchor
// cleanly at the point (no phantom gap). The "+" box beyond a stub is a plain
// button, shown only while unconnected:
//   • click → open the node picker
//   • drag  → forwarded to the point handle, so it pulls a connection with the
//     "+" riding the wavy line (custom connection line). Drop on a node connects
//     (the "+" then hides); drop on empty opens the picker.
function SourcePlusHandle({ nodeId, id, offset, label }) {
  const [open, setOpen] = useState(false);
  const addConnectedNode = useStore((s) => s.addConnectedNode);
  const startLinking = useStore((s) => s.startLinking);
  const moveLinking = useStore((s) => s.moveLinking);
  const finishLinking = useStore((s) => s.finishLinking);
  const onConnect = useStore((s) => s.onConnect);
  const isValidConnection = useStore((s) => s.isValidConnection);
  const connected = useStore((s) => s.edges.some((e) => e.sourceHandle === id));
  const top = `${offset * 100}%`;
  const draggedRef = useRef(false);

  // Drag the "+" → draw the line FROM the point (LinkingOverlay) and connect via
  // hit-test on drop. Fully manual so the origin is always the point, never the
  // "+", and edges stay anchored at the single point handle.
  const onPlusMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggedRef.current = false;
    const node = e.currentTarget.closest('.react-flow__node');
    const point = node?.querySelector(`.vs-out-point[data-handleid="${id}"]`);
    const r = point?.getBoundingClientRect();
    const fromX = r ? r.left + r.width / 2 : e.clientX;
    const fromY = r ? r.top + r.height / 2 : e.clientY;
    const sx = e.clientX;
    const sy = e.clientY;
    let started = false;

    const move = (ev) => {
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) <= 4) return;
        started = true;
        draggedRef.current = true;
        startLinking({ sourceId: nodeId, sourceHandle: id, fromX, fromY, toX: ev.clientX, toY: ev.clientY });
      } else {
        moveLinking(ev.clientX, ev.clientY);
      }
    };
    const up = (ev) => {
      cleanup();
      if (!started) return;
      finishLinking();
      // Resolve a target handle under the cursor.
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const handleEl = el?.closest('.react-flow__handle-left');
      const targetNodeEl = (handleEl ?? el)?.closest('.react-flow__node');
      if (!targetNodeEl) return;
      const target = targetNodeEl.getAttribute('data-id');
      const targetHandle =
        handleEl?.getAttribute('data-handleid') ??
        targetNodeEl.querySelector('.react-flow__handle-left')?.getAttribute('data-handleid');
      if (!target || !targetHandle) return;
      const conn = { source: nodeId, sourceHandle: id, target, targetHandle };
      if (isValidConnection(conn)) onConnect(conn);
    };
    const cleanup = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <>
      {label && (
        <span
          className="vs-eyebrow pointer-events-none absolute z-10 whitespace-nowrap text-vs-faint"
          style={{
            top,
            // sit after the "+" while unconnected, otherwise just past the point
            left: connected ? 'calc(100% + 14px)' : 'calc(100% + 54px)',
            transform: 'translateY(-50%)',
            fontSize: '9px',
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </span>
      )}

      {/* "+" — click to add · drag forwards to the point handle to connect */}
      {!connected && (
        <>
          <span
            className="pointer-events-none absolute h-px w-5 bg-vs-border-strong"
            style={{ top, left: 'calc(100% + 7px)', transform: 'translateY(-50%)' }}
          />
          <div
            className="nodrag nopan absolute z-10"
            style={{ top, left: 'calc(100% + 27px)', transform: 'translateY(-50%)', pointerEvents: 'auto' }}
          >
            <AddNodePicker
              open={open}
              onOpenChange={setOpen}
              filter={(t) => hasHandle(t, 'target')}
              onPick={(type) => addConnectedNode({ sourceId: nodeId, sourceHandle: id, type })}
              trigger={
                <button
                  aria-label="Add connected node"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseDown={onPlusMouseDown}
                  onClick={() => {
                    if (draggedRef.current) return; // a drag, not a click
                    setOpen(true);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-vs-border-strong bg-vs-surface text-vs-muted transition-colors hover:border-vs-accent hover:bg-vs-accent-tint hover:text-vs-accent-hover data-[state=open]:border-vs-accent data-[state=open]:bg-vs-accent-tint data-[state=open]:text-vs-accent-hover"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              }
            />
          </div>
        </>
      )}

      {/* the circle point — the single connection handle; edges anchor here */}
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        title="Drag to connect"
        className="vs-out-point"
        style={{ top }}
      />
    </>
  );
}

// Wraps a ReactFlow Handle with token-driven styling (see index.css) and an
// optional inline label. Right-side source handles use the "+" affordance above.
export function NodeHandle({ nodeId, id, kind, position = 'left', offset = 0.5, label }) {
  const side = POSITION[position] ?? Position.Left;
  const vertical = side === Position.Left || side === Position.Right;
  const isSourceRight = kind === 'source' && side === Position.Right;

  if (vertical && isSourceRight) {
    return <SourcePlusHandle nodeId={nodeId} id={id} offset={offset} label={label} />;
  }

  const style = vertical ? { top: `${offset * 100}%` } : { left: `${offset * 100}%` };

  return (
    <>
      <Handle type={kind} position={side} id={id} style={style} />

      {/* Labeled handle (e.g. left-side targets): float the label just outside
          the matching edge (left labels hang off the left edge). */}
      {vertical && label && (
        <span
          className="vs-eyebrow pointer-events-none absolute z-10 whitespace-nowrap text-vs-faint"
          style={{
            top: `${offset * 100}%`,
            transform: 'translateY(-50%)',
            ...(side === Position.Left
              ? { right: 'calc(100% + 7px)', textAlign: 'right' }
              : { left: 'calc(100% + 7px)' }),
            fontSize: '9px',
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </span>
      )}
    </>
  );
}
