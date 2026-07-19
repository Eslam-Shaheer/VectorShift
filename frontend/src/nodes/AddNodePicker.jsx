import * as Popover from '@radix-ui/react-popover';
import { Plus } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { nodeRegistry, paletteGroups } from './registry';

// Only nodes that can accept an incoming connection (have a static target
// handle) are offered, so the "+" always yields a connected node.
const connectableTypes = new Set(
  Object.values(nodeRegistry)
    .filter((c) => (c.handles ?? []).some((h) => h.kind === 'target'))
    .map((c) => c.type)
);

// n8n-style quick-add: a stub line + "+" that opens a node picker and creates a
// node already wired to `sourceHandle`.
export function AddNodePicker({ nodeId, sourceHandle }) {
  const addConnectedNode = useStore((s) => s.addConnectedNode);

  const pick = (type) => addConnectedNode({ sourceId: nodeId, sourceHandle, type });

  return (
    <Popover.Root>
      {/* nodrag/nopan so the click doesn't drag the node or pan the canvas */}
      <div className="nodrag nopan flex items-center" style={{ pointerEvents: 'auto' }}>
        <span className="h-px w-4 bg-vs-border-strong" />
        <Popover.Trigger asChild>
          <button
            aria-label="Add connected node"
            className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-vs-border-strong bg-vs-surface text-vs-muted transition-colors hover:border-vs-accent hover:bg-vs-accent-tint hover:text-vs-accent-hover data-[state=open]:border-vs-accent data-[state=open]:bg-vs-accent-tint data-[state=open]:text-vs-accent-hover"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={8}
          className="nodrag nopan z-50 max-h-80 w-52 overflow-y-auto rounded-[6px] border border-vs-border bg-vs-surface p-1.5 shadow-[var(--shadow-node)]"
        >
          {paletteGroups.map((group) => {
            const types = group.types.filter((t) => connectableTypes.has(t));
            if (types.length === 0) return null;
            return (
              <div key={group.category} className="mb-1 last:mb-0">
                <div className="vs-eyebrow px-2 py-1">{group.category}</div>
                {types.map((t) => {
                  const config = nodeRegistry[t];
                  const Icon = config.icon;
                  return (
                    <Popover.Close asChild key={t}>
                      <button
                        onClick={() => pick(t)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[13px] text-vs-ink transition-colors hover:bg-vs-accent-tint'
                        )}
                      >
                        {Icon && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-vs-surface-sunk text-vs-accent-hover">
                            <Icon size={12} strokeWidth={2} />
                          </span>
                        )}
                        {config.label}
                      </button>
                    </Popover.Close>
                  );
                })}
              </div>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
