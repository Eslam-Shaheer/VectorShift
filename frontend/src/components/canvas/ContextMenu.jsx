import { Copy, Trash2, ClipboardPaste, LayoutGrid, Eraser } from 'lucide-react';
import { useStore } from '@/store';

function Menu({ x, y, children }) {
  return (
    <div
      className="fixed z-[200] min-w-[160px] rounded-[6px] border border-vs-border bg-vs-surface p-1 shadow-(--shadow-node)"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

function Item({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[13px] transition-colors ' +
        (danger
          ? 'text-vs-danger hover:bg-vs-danger hover:text-vs-surface'
          : 'text-vs-ink hover:bg-vs-accent-tint')
      }
    >
      <Icon size={13} strokeWidth={2} />
      {label}
    </button>
  );
}

export function NodeContextMenu({ x, y, nodeId, onClose }) {
  const duplicateNode = useStore((s) => s.duplicateNode);
  const removeNode = useStore((s) => s.removeNode);
  const run = (fn) => () => {
    fn();
    onClose();
  };
  return (
    <Menu x={x} y={y}>
      <Item icon={Copy} label="Duplicate" onClick={run(() => duplicateNode(nodeId))} />
      <Item icon={Trash2} label="Delete" danger onClick={run(() => removeNode(nodeId))} />
    </Menu>
  );
}

export function PaneContextMenu({ x, y, onClose }) {
  const paste = useStore((s) => s.paste);
  const autoLayout = useStore((s) => s.autoLayout);
  const clear = useStore((s) => s.clear);
  const clipboard = useStore((s) => s.clipboard);
  const hasNodes = useStore((s) => s.nodes.length > 0);
  const run = (fn) => () => {
    fn();
    onClose();
  };
  return (
    <Menu x={x} y={y}>
      {clipboard.length > 0 && (
        <Item icon={ClipboardPaste} label="Paste" onClick={run(paste)} />
      )}
      {hasNodes && <Item icon={LayoutGrid} label="Auto-layout" onClick={run(autoLayout)} />}
      {hasNodes && <Item icon={Eraser} label="Clear canvas" danger onClick={run(clear)} />}
    </Menu>
  );
}
