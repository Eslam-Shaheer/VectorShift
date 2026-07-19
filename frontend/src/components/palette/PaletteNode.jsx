// draggableNode.js — a palette chip the user drags onto the canvas.

export const DraggableNode = ({ type, label, icon: Icon }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType })
    );
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.style.cursor = 'grabbing';
  };

  return (
    <div
      className="flex cursor-grab select-none items-center gap-2 rounded-[4px] border border-vs-border-strong bg-vs-surface px-2.5 py-2 text-[13px] font-medium text-vs-ink shadow-sm transition-colors hover:border-vs-accent hover:bg-vs-accent-tint"
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.currentTarget.style.cursor = 'grab')}
      draggable
    >
      {Icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-vs-accent-tint text-vs-accent-hover">
          <Icon size={13} strokeWidth={2} />
        </span>
      )}
      {label}
    </div>
  );
};
