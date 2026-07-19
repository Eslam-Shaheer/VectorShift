import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { NodeHandle } from "./NodeHandle";
import { NodeField } from "./NodeField";

// Groups handles by edge (left/right/top/bottom) and assigns each an even
// offset along that edge: (i + 1) / (n + 1). Replaces the hand-tuned
// `top: 100/3%` math the original LLM node carried.
function withOffsets(handles) {
  const bySide = {};
  for (const h of handles) (bySide[h.position] ??= []).push(h);
  const out = [];
  for (const side of Object.keys(bySide)) {
    const group = bySide[side];
    group.forEach((h, i) =>
      out.push({ ...h, offset: (i + 1) / (group.length + 1) }),
    );
  }
  return out;
}

// Generic, config-driven node body. Every node in the app is BaseNode + a
// config object — see registry.js. `config` shape:
//   { type, label, category, width?, handles?, fields?,
//     computeHandles?(data), computeWidth?(data), onFieldChange?(...) }
export function BaseNode({ id, data, selected, config }) {
  const staticHandles = config.handles ?? [];
  const dynamicHandles = config.computeHandles?.(data) ?? [];
  const handles = withOffsets([...staticHandles, ...dynamicHandles]);

  const width = config.computeWidth?.(data) ?? config.width ?? 240;

  const handleFieldChange = (key, value) =>
    config.onFieldChange?.(id, key, value, data);
  const removeNode = useStore((s) => s.removeNode);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-node border bg-vs-surface p-3 shadow-(--shadow-node) transition-shadow hover:shadow-(--shadow-node-hover)",
        selected
          ? "border-vs-accent ring-1 ring-vs-accent"
          : "border-vs-border",
      )}
      style={{ width }}
    >
      {/* n8n-style hover-delete: trash button appears at the top-right corner. */}
      <button
        aria-label="Delete node"
        onClick={() => removeNode(id)}
        className="nodrag nopan absolute -right-2.5 -top-2.5 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-vs-border-strong bg-vs-surface text-vs-muted shadow-(--shadow-btn) transition-colors hover:border-vs-danger hover:bg-vs-danger hover:text-vs-surface group-hover:flex"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>

      {/* n8n-style icon-forward header: icon tile + title + category subtitle */}
      <header className="flex items-center gap-2.5 border-b border-vs-border pb-2">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-vs-accent-tint text-vs-accent-hover">
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-[13px] font-semibold leading-tight text-vs-ink">
            {config.label}
          </h3>
          <span className="vs-eyebrow">{config.category}</span>
        </div>
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
          nodeId={id}
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
