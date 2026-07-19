import { useState } from 'react';
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

// A right-side source handle rendered as an n8n-style "+": the handle IS the
// button, so it supports BOTH gestures natively —
//   • drag  → pull a connection to an existing node (ReactFlow connection)
//   • click → open the picker to spawn a new connected node
// Laid out in a flex row (label → stub → +); the handle uses position:static so
// it sits in that row while ReactFlow still reads its real DOM rect for edges.
function SourcePlusHandle({ nodeId, id, offset, label }) {
  const [open, setOpen] = useState(false);
  const addConnectedNode = useStore((s) => s.addConnectedNode);
  const top = `${offset * 100}%`;

  return (
    <>
      {/* stub line from the node edge to the "+" */}
      <span
        className="pointer-events-none absolute h-px w-3.5 bg-vs-border-strong"
        style={{ top, left: '100%', transform: 'translateY(-50%)' }}
      />
      {label && (
        <span
          className="vs-eyebrow pointer-events-none absolute z-10 whitespace-nowrap text-vs-faint"
          style={{ top, left: 'calc(100% + 40px)', transform: 'translateY(-50%)', fontSize: '9px', letterSpacing: '0.1em' }}
        >
          {label}
        </span>
      )}
      <AddNodePicker
        open={open}
        onOpenChange={setOpen}
        filter={(t) => hasHandle(t, 'target')}
        onPick={(type) => addConnectedNode({ sourceId: nodeId, sourceHandle: id, type })}
        anchor={
          <Handle
            type="source"
            position={Position.Right}
            id={id}
            title="Drag to connect · click to add a node"
            className="vs-plus-handle nodrag nopan"
            style={{ top, right: -34 }}
            // click (no drag) opens the picker; a real drag makes a connection
            onClick={() => setOpen(true)}
          >
            {/* pointer-events:none so ReactFlow sees the handle (not the icon)
                as the mousedown target and can start a connection */}
            <Plus size={12} strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
          </Handle>
        }
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
