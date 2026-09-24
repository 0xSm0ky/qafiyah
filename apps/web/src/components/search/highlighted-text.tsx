'use client';

import { Fragment } from 'react';

import { splitHighlightedParts } from '@/lib/search/highlighted-terms';
import { cn } from '@/lib/utils';

export { mergeAdjacentMarks } from '@/lib/search/highlighted-terms';

type Props = {
  readonly text: string;
  readonly className?: string;
};

export function HighlightedText({ text, className = '' }: Props) {
  const parts = splitHighlightedParts(text);

  const renderedParts = parts.map((part, index) => {
    const isHighlighted = index % 2 === 1;

    const segments = part.split('*');

    return (
      // oxlint-disable-next-line react/no-array-index-key -- parts come from a stable text split, order is fixed and content can repeat
      <Fragment key={`part-${index}-${part.slice(0, 10)}`}>
        {segments.map((segment, segmentIndex) => (
          // oxlint-disable-next-line react/no-array-index-key -- segment order within a part is fixed by the source string
          <Fragment key={`seg-${index}-${segmentIndex}-${segment.slice(0, 5)}`}>
            {segmentIndex > 0 && (
              <span className="mx-1 inline-block py-1 text-text-subtle">{'-'}</span>
            )}
            {isHighlighted ? (
              <span className="rounded-sm bg-highlight box-decoration-clone px-1 py-0.5 text-surface">
                {segment}
              </span>
            ) : (
              <span className="py-0.5">{segment}</span>
            )}
          </Fragment>
        ))}
      </Fragment>
    );
  });

  return (
    <div className={cn(className)} dir="rtl" style={{ userSelect: 'text' }}>
      {renderedParts}
    </div>
  );
}
