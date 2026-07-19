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
  const connected = useStore((s) => s.edges.some((e) => e.sourceHandle === id));
  const top = `${offset * 100}%`;
  const draggedRef = useRef(false);

  // Turn a press-drag on the "+" into a connection drag from the point handle by
  // replaying pointerdown on it once the pointer moves past a small threshold.
  const onPlusPointerDown = (e) => {
    if (e.button !== 0) return;
    draggedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const node = e.currentTarget.closest('.react-flow__node');
    const point = node?.querySelector(`.vs-out-point[data-handleid="${id}"]`);

    const move = (ev) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 4) return;
      draggedRef.current = true;
      cleanup();
      // Start the connection FROM the point handle (ReactFlow v11 listens on
      // mousedown) so the line originates at the point, not the "+".
      point?.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          clientX: startX,
          clientY: startY,
        })
      );
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', cleanup);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', cleanup);
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
                  onPointerDown={onPlusPointerDown}
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
