import { useEffect } from 'react';
import { useStore } from '@/store';
import { hasHandle } from '@/lib/graph';
import { AddNodePicker } from '@/nodes/AddNodePicker';

// Shown when a connection drag is released on empty canvas (n8n style). Opens the
// node picker at the drop point; picking a type creates a node there, already
// wired to the source handle.
export function ConnectionDropMenu({ drop, onClose }) {
  const addConnectedNode = useStore((s) => s.addConnectedNode);

  // The ReactFlow pane swallows pointerdown, so Radix's outside-click can't see
  // canvas clicks. Close on the next pointerdown outside the popover ourselves
  // (capture phase, deferred one tick so the opening drag-end doesn't count).
  useEffect(() => {
    const onDown = (e) => {
      if (e.target.closest?.('[data-radix-popper-content-wrapper]')) return;
      onClose();
    };
    const id = setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [onClose]);

  return (
    <AddNodePicker
      open
      onOpenChange={(o) => !o && onClose()}
      filter={(t) => hasHandle(t, 'target')}
      onPick={(type) => {
        addConnectedNode({
          sourceId: drop.sourceId,
          sourceHandle: drop.sourceHandle,
          type,
          position: drop.flowPosition,
        });
        onClose();
      }}
      anchor={
        <div
          className="fixed h-0 w-0"
          style={{ left: drop.x, top: drop.y }}
          aria-hidden
        />
      }
    />
  );
}
