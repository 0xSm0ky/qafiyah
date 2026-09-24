// oxlint-disable react/refs -- false positive: the props union has a `loadMoreRef` variant,
'use client';

import { Loader2 } from 'lucide-react';
import { match } from 'ts-pattern';

import { Button } from '@/components/ui/button';
import { SEARCH_TEXTS } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

import { PoemCard, PoetCard } from './result-cards';

import type { PoemSearchResult, PoetSearchResult } from '@/lib/api/result-types';
import type React from 'react';
import type { Ref } from 'react';

type SectionProps = {
  readonly title: string;
  readonly items: readonly (PoemSearchResult | PoetSearchResult)[];
  readonly resultText: string;
  readonly isFetchingMore: boolean;
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
} & (
  | { readonly layout: 'horizontal'; readonly loadMoreRef: Ref<HTMLDivElement> }
  | { readonly layout: 'vertical'; readonly onLoadMore: () => void; readonly hasNextPage: boolean }
);

export function SearchSection(props: SectionProps) {
  const { title, items, resultText, isFetchingMore, headingRef } = props;

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex w-full flex-row items-center justify-between gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={cn('text-sm text-text-muted focus:outline-none md:text-base')}
        >
          {title}
        </h2>
        <p className={cn('text-end text-xs text-pretty text-text-subtle tabular-nums md:text-sm')}>
          {resultText}
        </p>
      </div>

      {props.layout === 'horizontal' ? (
        <div className="search-results-scroll -mx-1 flex flex-row gap-3 overflow-x-auto overscroll-x-contain px-1 py-1">
          <div className="flex shrink-0 flex-col gap-3">
            {[0, 1].map((row) => (
              <div key={row} className="flex flex-row gap-3">
                {items
                  .filter((_, index) => index % 2 === row)
                  .map((item) =>
                    match(item)
                      .with({ type: 'poet' }, (poet) => (
                        <div key={`${poet.slug}-${poet.relevance}`} className="shrink-0">
                          <PoetCard item={poet} />
                        </div>
                      ))
                      .otherwise(() => null)
                  )}
              </div>
            ))}
          </div>
          <div ref={props.loadMoreRef} className="flex w-12 shrink-0 items-center justify-center">
            {isFetchingMore && <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) =>
            match(item)
              .with({ type: 'poem' }, (poem) => (
                <PoemCard key={`${poem.slug}-${poem.relevance}`} item={poem} number={index + 1} />
              ))
              .with({ type: 'poet' }, (poet) => (
                <PoetCard key={`${poet.slug}-${poet.relevance}`} item={poet} />
              ))
              .exhaustive()
          )}

          {props.hasNextPage &&
            (isFetchingMore ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={props.onLoadMore}
                className="group h-auto w-full px-0 py-4 hover:bg-transparent focus-visible:ring-0"
              >
                <span className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm transition-colors group-hover:bg-surface-hover group-focus-visible:ring-1 group-focus-visible:ring-text">
                  {SEARCH_TEXTS.loadMorePoems}
                </span>
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
