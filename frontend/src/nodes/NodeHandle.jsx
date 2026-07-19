import { Handle, Position } from 'reactflow';

const POSITION = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

// Wraps a ReactFlow Handle with token-driven styling (see index.css) and an
// optional inline label. `offset` (0..1) places the handle along the node edge;
// BaseNode spaces same-side handles evenly by index.
export function NodeHandle({ id, kind, position = 'left', offset = 0.5, label }) {
  const side = POSITION[position] ?? Position.Left;
  const vertical = side === Position.Left || side === Position.Right;
  const style = vertical
    ? { top: `${offset * 100}%` }
    : { left: `${offset * 100}%` };

  const labelStyle = vertical
    ? { top: `${offset * 100}%`, transform: 'translateY(-50%)', [position]: 14 }
    : null;

  return (
    <>
      <Handle type={kind} position={side} id={id} style={style} />
      {label && vertical && (
        <span
          className="vs-eyebrow pointer-events-none absolute z-10 whitespace-nowrap text-vs-faint"
          style={{ ...labelStyle, fontSize: '9px', letterSpacing: '0.12em' }}
        >
          {label}
        </span>
      )}
    </>
  );
}
