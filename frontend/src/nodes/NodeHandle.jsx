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

// Wraps a ReactFlow Handle with token-driven styling (see index.css), an
// optional inline label, and — for right-side source handles — an n8n-style
// "+" quick-add button. `offset` (0..1) places the handle along the node edge.
export function NodeHandle({ nodeId, id, kind, position = 'left', offset = 0.5, label }) {
  const side = POSITION[position] ?? Position.Left;
  const vertical = side === Position.Left || side === Position.Right;
  const style = vertical ? { top: `${offset * 100}%` } : { left: `${offset * 100}%` };

  // A source handle already feeding an edge shouldn't offer another "+".
  const connected = useStore((s) => s.edges.some((e) => e.sourceHandle === id));
  const addConnectedNode = useStore((s) => s.addConnectedNode);
  const isSourceRight = kind === 'source' && side === Position.Right;

  return (
    <>
      <Handle type={kind} position={side} id={id} style={style} />

      {/* Right-side source handle: label → stub → "+" on one line, just outside
          the node edge (no overlap with fields or with each other). */}
      {vertical && isSourceRight && (
        <div
          className="absolute z-10 flex items-center gap-1.5"
          style={{ top: `${offset * 100}%`, left: 'calc(100% + 6px)', transform: 'translateY(-50%)' }}
        >
          {label && (
            <span
              className="vs-eyebrow pointer-events-none whitespace-nowrap text-vs-faint"
              style={{ fontSize: '9px', letterSpacing: '0.1em' }}
            >
              {label}
            </span>
          )}
          {!connected && (
            <div className="nodrag nopan flex items-center" style={{ pointerEvents: 'auto' }}>
              <span className="h-px w-4 bg-vs-border-strong" />
              <AddNodePicker
                filter={(t) => hasHandle(t, 'target')}
                onPick={(type) => addConnectedNode({ sourceId: nodeId, sourceHandle: id, type })}
                trigger={
                  <button
                    aria-label="Add connected node"
                    className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-vs-border-strong bg-vs-surface text-vs-muted transition-colors hover:border-vs-accent hover:bg-vs-accent-tint hover:text-vs-accent-hover data-[state=open]:border-vs-accent data-[state=open]:bg-vs-accent-tint data-[state=open]:text-vs-accent-hover"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Any other labeled handle (e.g. left-side targets): float the label
          just outside the matching edge (left labels hang off the left edge). */}
      {vertical && !isSourceRight && label && (
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
