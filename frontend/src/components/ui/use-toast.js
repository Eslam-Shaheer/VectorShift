import { useEffect, useState } from 'react';

// Minimal toast store — a trimmed take on shadcn's use-toast: one visible toast
// at a time, imperatively pushed via toast(), consumed by <Toaster />.
let count = 0;
const listeners = new Set();
let memory = { toasts: [] };

function emit() {
  for (const l of listeners) l(memory);
}

export function toast({ duration = 6000, ...props }) {
  const id = String(++count);
  memory = { toasts: [{ id, open: true, duration, ...props }] };
  emit();
  return { id };
}

export function dismiss(id) {
  memory = {
    toasts: memory.toasts.map((t) =>
      id === undefined || t.id === id ? { ...t, open: false } : t
    ),
  };
  emit();
}

export function useToast() {
  const [state, setState] = useState(memory);
  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);
  return { ...state, toast, dismiss };
}
