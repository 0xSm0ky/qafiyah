'use client';

import { Frown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SUPPORT_EMAIL } from '@/lib/constants/config';
import { ERROR_TEXTS } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

function SupportLine({ className }: { readonly className?: string }) {
  return (
    <p className={cn('text-center text-xs text-danger md:text-sm', className)}>
      {ERROR_TEXTS.supportPrefix}{' '}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        dir="ltr"
        className="rounded-sm text-danger underline underline-offset-2 focus-ring"
      >
        {SUPPORT_EMAIL}
      </a>
    </p>
  );
}

type ErrorStateProps = {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly className?: string;
};

export function ErrorState({
  message = ERROR_TEXTS.unexpected,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card
      dir="rtl"
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-danger px-4 py-8',
        className
      )}
    >
      <Frown className="h-12 w-12 text-danger md:h-16 md:w-16" aria-hidden="true" />
      <p className="text-center text-sm text-danger md:text-base">{message}</p>
      <SupportLine />
      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-2 border-danger text-xs text-danger md:text-sm"
        >
          {ERROR_TEXTS.retry}
        </Button>
      )}
    </Card>
  );
}
