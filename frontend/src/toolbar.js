// toolbar.js — the NodePalette: draggable chips grouped by category.

import { DraggableNode } from './draggableNode';
import { nodeRegistry, paletteGroups } from './nodes/registry';

export const PipelineToolbar = () => {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r border-vs-border bg-vs-surface-sunk/40 px-4 py-5">
      <div className="flex flex-col gap-1">
        <span className="vs-eyebrow">Palette</span>
        <p className="text-[13px] text-vs-muted">Drag a node onto the canvas.</p>
      </div>

      {paletteGroups.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <span className="vs-eyebrow">{group.category}</span>
          <div className="flex flex-col gap-1.5">
            {group.types.map((type) => (
              <DraggableNode
                key={type}
                type={type}
                label={nodeRegistry[type].label}
                icon={nodeRegistry[type].icon}
              />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
};
