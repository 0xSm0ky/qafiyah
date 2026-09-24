import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-normal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-surface hover:opacity-90',
        secondary: 'border-transparent bg-surface-sunken text-text hover:bg-surface-hover',
        destructive: 'border-transparent bg-danger text-surface hover:opacity-90',
        outline: 'text-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
