import * as React from 'react';

import { cn } from '@/lib/utils';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-subtle transition-colors hover:text-text focus:outline-none focus-visible:ring-1 focus-visible:ring-text disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';

export { IconButton };
