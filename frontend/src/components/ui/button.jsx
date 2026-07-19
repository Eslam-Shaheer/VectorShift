import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vs-accent focus-visible:ring-offset-1 focus-visible:ring-offset-vs-surface disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // primary: ink fill, cream text — the marquee action
        primary:
          'bg-vs-ink text-vs-surface hover:bg-vs-ink-deep shadow-btn',
        secondary:
          'bg-vs-surface text-vs-ink border border-vs-border-strong hover:bg-vs-surface-sunk',
        ghost: 'text-vs-body hover:bg-vs-surface-sunk hover:text-vs-ink',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-[13px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
