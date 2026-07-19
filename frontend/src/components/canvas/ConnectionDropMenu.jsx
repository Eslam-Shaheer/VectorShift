import { useStore } from '@/store';
import { hasHandle } from '@/lib/graph';
import { AddNodePicker } from '@/nodes/AddNodePicker';

// Shown when the user drags a node's "+" and releases on empty canvas (n8n
// style). Opens the node picker at the drop point; picking a type creates a node
// there, already wired to the dragged source handle.
export function ConnectionDropMenu({ drop, onClose }) {
  const addConnectedNode = useStore((s) => s.addConnectedNode);

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
