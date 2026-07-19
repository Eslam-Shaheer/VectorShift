import { useLayoutEffect, useRef } from 'react';

// Grows a textarea's height to fit its content. Returns a ref to attach to the
// textarea; re-measures whenever `value` changes. No-op unless `enabled`.
export function useAutoResizeTextarea(value, enabled = true) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, enabled]);
  return ref;
}
