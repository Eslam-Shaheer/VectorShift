import { createPortal } from 'react-dom';
import { getSmoothStepPath, Position } from 'reactflow';
import { useStore } from '@/store';

// Full-screen overlay that draws the "+"-drag connection in SCREEN space: an
// orthogonal accent path from the source point to the cursor, with the "+" chip
// riding the moving end. Screen coords, so it's independent of the canvas transform.
export function LinkingOverlay() {
  const linking = useStore((s) => s.linking);
  if (!linking) return null;

  const { fromX, fromY, toX, toY } = linking;
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: Position.Right,
    targetX: toX,
    targetY: toY,
    targetPosition: Position.Left,
    borderRadius: 12,
  });

  return createPortal(
    <svg
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 60 }}
    >
      <path d={path} fill="none" stroke="var(--color-vs-accent)" strokeWidth={1.75} strokeLinecap="round" />
      <g transform={`translate(${toX - 10}, ${toY - 10})`}>
        <rect width={20} height={20} rx={4} fill="var(--color-vs-surface)" stroke="var(--color-vs-accent)" strokeWidth={1} />
        <path d="M10 5.5 V14.5 M5.5 10 H14.5" stroke="var(--color-vs-accent-hover)" strokeWidth={2} strokeLinecap="round" />
      </g>
    </svg>,
    document.body
  );
}
