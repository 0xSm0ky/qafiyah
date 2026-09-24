'use client';

import { Badge } from '@/components/ui/badge';
import { highlightedTerms } from '@/lib/search/highlighted-terms';
import { poemUrl, poetUrl } from '@/lib/urls';

import { HighlightedText } from './highlighted-text';

import type { PoemSearchResult, PoetSearchResult } from '@/lib/api/result-types';

const cardClassname =
  'group -mx-2 flex cursor-pointer items-center justify-center overflow-hidden border-b border-border px-2 py-4 transition-colors duration-300 hover:bg-surface-hover';

const poetCardClassname =
  'group flex flex-row items-center justify-between gap-2 overflow-hidden rounded-sm border border-border p-3 transition-colors duration-300 hover:bg-surface-hover focus-ring';

const badgeClassname = 'text-xs py-1 text-text-subtle';

export function PoemCard({ item, number }: { item: PoemSearchResult; number: number }) {
  const { title, slug, snippet, poet, meter, era } = item;
  const href = poemUrl(slug, highlightedTerms(snippet));
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the title anchor is the accessible link; the card click is a pointer convenience
    <div
      className={cardClassname}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        window.location.assign(href);
      }}
    >
      <div className="flex h-full w-full flex-col gap-4">
        <div className="flex flex-row items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <a
              href={href}
              className="rounded-sm text-lg leading-snug font-bold text-text focus-ring transition-colors hover:underline hover:underline-offset-4 md:text-xl"
            >
              {title}
            </a>

            <a
              href={poetUrl(poet.slug)}
              className="w-fit rounded-sm text-sm text-text-muted focus-ring transition-colors hover:text-text hover:underline hover:underline-offset-4 md:text-base"
            >
              {poet.name}
            </a>
          </div>
          <span dir="ltr" className="shrink-0 text-xs text-text-subtle tabular-nums">
            #{number}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <HighlightedText
            className="text-base leading-relaxed text-text-muted md:text-lg"
            text={snippet}
          />
          <div className="flex items-center justify-end gap-1">
            {meter.name && (
              <Badge variant="outline" className={badgeClassname}>
                {meter.name}
              </Badge>
            )}
            {era.name && (
              <Badge variant="outline" className={badgeClassname}>
                {era.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PoetCard({ item }: { item: PoetSearchResult }) {
  const { name, slug, era } = item;
  return (
    <a href={poetUrl(slug)} className={poetCardClassname}>
      <span className="flex-1 text-base text-text transition-colors hover:underline hover:underline-offset-4 md:text-lg">
        {name}
      </span>

      {era.name && <span className="shrink-0 text-xs text-text-subtle">{era.name}</span>}
    </a>
  );
}
