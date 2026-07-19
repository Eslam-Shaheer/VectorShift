import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-8 w-full rounded-[4px] border border-vs-border-strong bg-vs-surface px-2.5 py-1 text-[13px] text-vs-ink shadow-sm transition-colors placeholder:text-vs-faint focus-visible:outline-none focus-visible:border-vs-accent focus-visible:ring-2 focus-visible:ring-vs-accent/30 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
