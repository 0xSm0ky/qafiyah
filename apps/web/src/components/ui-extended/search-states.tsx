'use client';

import { Loader2, SearchIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function LoadingState() {
  return (
    <div className="flex justify-center p-6">
      <Loader2 className="h-6 w-6 animate-spin text-text-subtle" />
    </div>
  );
}

export function NoResultsState({ noResultsText }: { readonly noResultsText: string }) {
  return (
    <Card className="border-border bg-surface-sunken shadow-none">
      <CardContent className="flex flex-col items-center justify-center p-8 text-text-subtle">
        <SearchIcon className="mb-3 h-10 w-10 text-text-subtle" />
        <p className="text-center text-base">{noResultsText}</p>
      </CardContent>
    </Card>
  );
}
