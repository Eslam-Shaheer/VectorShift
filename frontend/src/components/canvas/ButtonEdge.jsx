import { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';
import { X, Plus } from 'lucide-react';
import { useStore } from '@/store';
import { hasHandle } from '@/lib/graph';
import { AddNodePicker } from '@/nodes/AddNodePicker';

// n8n-style edge: an orthogonal (smoothstep) connector with rounded corners and
// a "×" delete + "+" insert button that appear at the midpoint on hover. A wide
// transparent path gives the thin edge a usable hover target.
export function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const removeEdge = useStore((s) => s.removeEdge);
  const insertNodeOnEdge = useStore((s) => s.insertNodeOnEdge);
  const showButtons = hovered || menuOpen;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {/* invisible fat hit area so the 1.5px edge is easy to hover */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />

      <EdgeLabelRenderer>
        {showButtons && (
          <div
            className="nodrag nopan absolute flex items-center gap-1"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Insert a node onto this edge (splits it in two) */}
            <AddNodePicker
              filter={(t) => hasHandle(t, 'target') && hasHandle(t, 'source')}
              onOpenChange={setMenuOpen}
              onPick={(type) => insertNodeOnEdge({ edgeId: id, type })}
              trigger={
                <button
                  aria-label="Insert node on connection"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-vs-border-strong bg-vs-surface text-vs-muted shadow-(--shadow-btn) transition-colors hover:border-vs-accent hover:bg-vs-accent hover:text-vs-surface"
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              }
            />
            <button
              aria-label="Delete connection"
              className="flex h-5 w-5 items-center justify-center rounded-full border border-vs-border-strong bg-vs-surface text-vs-muted shadow-(--shadow-btn) transition-colors hover:border-vs-danger hover:bg-vs-danger hover:text-vs-surface"
              onClick={() => removeEdge(id)}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </g>
  );
}
