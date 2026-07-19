import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        // accent = the "good" state (Valid DAG)
        accent: 'border-vs-accent/40 bg-vs-accent-tint text-vs-accent-hover',
        // muted = the neutral/negative state (Contains a cycle)
        muted: 'border-vs-border-strong bg-vs-surface-sunk text-vs-muted',
        outline: 'border-vs-border-strong text-vs-body',
      },
    },
    defaultVariants: { variant: 'muted' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
