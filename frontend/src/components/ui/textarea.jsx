import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[52px] w-full rounded-[4px] border border-vs-border-strong bg-vs-surface px-2.5 py-1.5 text-[13px] leading-relaxed text-vs-ink shadow-sm transition-colors placeholder:text-vs-faint focus-visible:outline-none focus-visible:border-vs-accent focus-visible:ring-2 focus-visible:ring-vs-accent/30 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
