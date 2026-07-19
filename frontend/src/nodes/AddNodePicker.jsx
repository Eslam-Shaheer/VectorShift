import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nodeRegistry, paletteGroups } from './registry';

// Reusable node picker popover. `trigger` is the clickable element (trigger
// mode), or pass `anchor` + controlled `open`/`onOpenChange` (anchor mode).
// `onPick(type)` fires on selection; `filter(type)` limits offered nodes.
// A search field filters by label; the popover dismisses on outside click,
// Escape, or a pick (all via Radix onOpenChange).
export function AddNodePicker({
  trigger,
  anchor,
  open,
  onPick,
  filter = () => true,
  side = 'right',
  onOpenChange,
}) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return paletteGroups
      .map((group) => ({
        category: group.category,
        types: group.types.filter(
          (t) => filter(t) && nodeRegistry[t].label.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.types.length > 0);
  }, [query, filter]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setQuery('');
        onOpenChange?.(o);
      }}
    >
      {anchor ? (
        <Popover.Anchor asChild>{anchor}</Popover.Anchor>
      ) : (
        <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      )}
      <Popover.Portal>
        <Popover.Content
          side={side}
          align="start"
          sideOffset={8}
          className="nodrag nopan z-50 flex max-h-96 w-56 flex-col overflow-hidden rounded-[6px] border border-vs-border bg-vs-surface shadow-(--shadow-node)"
        >
          <div className="flex items-center gap-2 border-b border-vs-border px-2.5 py-2">
            <Search size={13} className="shrink-0 text-vs-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="w-full bg-transparent text-[13px] text-vs-ink placeholder:text-vs-faint focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto p-1.5">
            {groups.length === 0 && (
              <div className="px-2 py-4 text-center text-[13px] text-vs-muted">No nodes found</div>
            )}
            {groups.map((group) => (
              <div key={group.category} className="mb-1 last:mb-0">
                <div className="vs-eyebrow px-2 py-1">{group.category}</div>
                {group.types.map((t) => {
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
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
