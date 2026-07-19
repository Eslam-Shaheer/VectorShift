import { NodeHandle } from './NodeHandle';
import { NodeField } from './NodeField';

// Groups handles by edge (left/right/top/bottom) and assigns each an even
// offset along that edge: (i + 1) / (n + 1). Replaces the hand-tuned
// `top: 100/3%` math the original LLM node carried.
function withOffsets(handles) {
  const bySide = {};
  for (const h of handles) (bySide[h.position] ??= []).push(h);
  const out = [];
  for (const side of Object.keys(bySide)) {
    const group = bySide[side];
    group.forEach((h, i) => out.push({ ...h, offset: (i + 1) / (group.length + 1) }));
  }
  return out;
}

// Generic, config-driven node body. Every node in the app is BaseNode + a
// config object — see registry.js. `config` shape:
//   { type, label, category, width?, handles?, fields?,
//     computeHandles?(data), computeWidth?(data), onFieldChange?(...) }
export function BaseNode({ id, data, config }) {
  const staticHandles = config.handles ?? [];
  const dynamicHandles = config.computeHandles?.(data) ?? [];
  const handles = withOffsets([...staticHandles, ...dynamicHandles]);

  const width = config.computeWidth?.(data) ?? config.width ?? 240;

  const handleFieldChange = (key, value) => config.onFieldChange?.(id, key, value, data);

  return (
    <div
      className="group relative flex flex-col gap-2 rounded-[8px] border border-vs-border bg-vs-surface p-3 shadow-[var(--shadow-node)] transition-shadow hover:shadow-[var(--shadow-node-hover)]"
      style={{ width }}
    >
      <header className="flex flex-col gap-0.5 border-b border-vs-border pb-2">
        <span className="vs-eyebrow">{config.category}</span>
        <h3 className="text-[13px] font-semibold leading-tight text-vs-ink">{config.label}</h3>
      </header>

      {config.fields?.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {config.fields.map((field) => (
            <NodeField
              key={field.key}
              nodeId={id}
              field={field}
              onValueChange={handleFieldChange}
            />
          ))}
        </div>
      )}

      {handles.map((h) => (
        <NodeHandle
          key={`${h.kind}-${h.id}`}
          id={`${id}-${h.id}`}
          kind={h.kind}
          position={h.position}
          offset={h.offset}
          label={h.label}
        />
      ))}
    </div>
  );
}
