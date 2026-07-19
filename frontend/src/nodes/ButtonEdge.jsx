import { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { X } from 'lucide-react';
import { useStore } from '@/store';

// n8n-style edge: a bezier connector with a "×" delete button that appears at
// the midpoint on hover. A wide transparent path gives the thin edge a usable
// hover target.
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
  const removeEdge = useStore((s) => s.removeEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {/* invisible fat hit area so the 1.5px edge is easy to hover */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />

      <EdgeLabelRenderer>
        {hovered && (
          <button
            aria-label="Delete connection"
            className="nodrag nopan absolute flex h-5 w-5 items-center justify-center rounded-full border border-vs-border-strong bg-vs-surface text-vs-muted shadow-(--shadow-btn) transition-colors hover:border-vs-danger hover:bg-vs-danger hover:text-vs-surface"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onMouseEnter={() => setHovered(true)}
            onClick={() => removeEdge(id)}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </EdgeLabelRenderer>
    </g>
  );
}
