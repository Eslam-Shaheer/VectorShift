import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

// Renders the active toast(s). Toast bodies are passed as `content` so callers
// (e.g. the ResultToast) can supply fully styled, brand-specific markup.
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, content, duration, open }) => (
        <Toast
          key={id}
          duration={duration}
          open={open}
          onOpenChange={(o) => !o && dismiss(id)}
        >
          <div className="flex-1">{content}</div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
