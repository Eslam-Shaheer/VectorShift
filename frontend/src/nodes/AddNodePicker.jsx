import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { nodeRegistry, paletteGroups } from './registry';

// Reusable node picker popover. `trigger` is the clickable element, `onPick`
// receives the chosen type, and `filter(type)` limits the offered nodes (e.g.
// quick-add needs a target handle; edge-insert needs both a target and source).
export function AddNodePicker({ trigger, onPick, filter = () => true, side = 'right', onOpenChange }) {
  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align="start"
          sideOffset={8}
          className="nodrag nopan z-50 max-h-80 w-52 overflow-y-auto rounded-[6px] border border-vs-border bg-vs-surface p-1.5 shadow-(--shadow-node)"
        >
          {paletteGroups.map((group) => {
            const types = group.types.filter(filter);
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
                        onClick={() => onPick(t)}
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
