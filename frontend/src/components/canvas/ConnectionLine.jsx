import { getBezierPath, Position } from 'reactflow';

// The line shown while dragging out a connection. Draws a wavy accent bezier
// from the source to the cursor, with the "+" chip riding at the moving end —
// so it reads as "dragging the + out with the line" (n8n behavior).
export function ConnectionLine({ fromX, fromY, toX, toY, fromPosition, toPosition }) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition ?? Position.Right,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition ?? Position.Left,
  });

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="var(--color-vs-accent)"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <g transform={`translate(${toX - 10}, ${toY - 10})`}>
        <rect
          width={20}
          height={20}
          rx={4}
          fill="var(--color-vs-surface)"
          stroke="var(--color-vs-accent)"
          strokeWidth={1}
        />
        <path
          d="M10 5.5 V14.5 M5.5 10 H14.5"
          stroke="var(--color-vs-accent-hover)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
