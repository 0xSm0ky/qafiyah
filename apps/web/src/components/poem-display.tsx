'use client';

import { Fragment, type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';

import { formatArabicCount } from '@/lib/arabic';
import { CLASSICAL_POEM_TYPE, VERSES_NOUN_FORMS } from '@/lib/constants/taxonomy-data';
import { buildHighlightRegex, highlightSegments, parseHighlightTerms } from '@/lib/highlight';
import { useSettings } from '@/lib/settings/use-settings';
import { poetsUrl, poetUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';

import type { Poem } from '@/lib/api/result-types';

const VERSE_GAP = 'gap-10 sm:gap-12';
const HEMISTICH_GAP = 'gap-4 sm:gap-5';

function useHighlightTerms(): readonly string[] {
  const [terms, setTerms] = useState<readonly string[]>([]);

  useEffect(() => {
    const parsed = parseHighlightTerms(window.location.hash);
    // oxlint-disable-next-line react/set-state-in-effect
    if (parsed.length > 0) setTerms(parsed);
  }, []);

  useEffect(() => {
    if (terms.length === 0) return;
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-highlight]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [terms]);

  return terms;
}

function highlightVerse(text: string, regex: RegExp): ReactNode {
  const segments = highlightSegments(text, regex);
  if (segments.length === 1 && segments[0]?.highlighted !== true) return text;
  return (
    <>
      {segments.map((segment, index) => {
        const key = `${segment.text}-${index}`;
        return segment.highlighted ? (
          <span
            key={key}
            data-highlight=""
            className="rounded-sm bg-highlight box-decoration-clone px-1 py-0.5 text-surface"
          >
            {segment.text}
          </span>
        ) : (
          <Fragment key={key}>{segment.text}</Fragment>
        );
      })}
    </>
  );
}

type PoemDisplayProps = {
  readonly title: string;
  readonly poet: Poem['poet'];
  readonly era: Poem['era'];
  readonly meter: Poem['meter'];
  readonly theme: Poem['theme'];
  readonly verses: Poem['verses'];
  readonly verseCount: Poem['verseCount'];
  readonly poemType: Poem['poemType'];
};

export function PoemDisplay({
  title,
  poet,
  era,
  meter,
  theme,
  verses,
  verseCount,
  poemType,
}: PoemDisplayProps) {
  const isClassical = poemType.slug === CLASSICAL_POEM_TYPE;
  const { poemFontScale } = useSettings();
  const highlightTerms = useHighlightTerms();
  const highlightRegex = useMemo(() => buildHighlightRegex(highlightTerms), [highlightTerms]);
  return (
    <>
      <header className="flex w-full flex-col items-center justify-center gap-4 text-center xxs:gap-6">
        <div className="flex flex-col gap-2 xxs:gap-4">
          <h1 className="text-poem-title text-text">{title}</h1>

          <h2 className="text-poem-byline text-text-muted">
            <a href={poetUrl(poet.slug)} className="rounded-sm focus-ring hover:underline">
              {poet.name}
            </a>{' '}
            <a href={poetsUrl({ era: era.slug })} className="rounded-sm focus-ring hover:underline">
              {`(${era.name})`}
            </a>
          </h2>
        </div>

        <div className="flex w-full items-center justify-between px-2.5 text-poem-meta text-text-subtle md:w-8/12 md:px-8 lg:px-16">
          <p className="flex-1 border-l py-0.5 md:py-1 lg:py-1.5">{meter.name}</p>
          <p className="flex-1 border-l py-0.5 md:py-1 lg:py-1.5">
            {formatArabicCount({ count: verseCount, nounForms: VERSES_NOUN_FORMS })}
          </p>
          <p className="flex-1 py-0.5 md:py-1 lg:py-1.5">{theme.name}</p>
        </div>
      </header>

      <div className="relative flex w-full flex-col items-center justify-between">
        <article className="flex w-full flex-col items-center p-6 md:p-8">
          <div
            className={cn(
              'flex w-full flex-col text-verse font-normal',
              VERSE_GAP,
              isClassical ? 'max-w-[calc(16em*var(--poem-scale))]' : 'px-(--poem-gutter)'
            )}
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CSS custom properties are not part of the CSSProperties type
            style={{ '--poem-scale': poemFontScale } as CSSProperties}
          >
            {verses.map(([sadr = '', ajuz = '']) => (
              <div
                key={`${sadr}|${ajuz}`}
                className={cn(
                  'flex w-full flex-col items-center justify-center text-center',
                  HEMISTICH_GAP,
                  isClassical && 'items-stretch'
                )}
              >
                <p
                  style={{ fontSize: `${poemFontScale}em` }}
                  lang="ar"
                  dir="rtl"
                  className={cn(isClassical && 'pe-12 text-right')}
                >
                  {highlightRegex ? highlightVerse(sadr, highlightRegex) : sadr}
                </p>
                <p
                  style={{ fontSize: `${poemFontScale}em` }}
                  lang="ar"
                  dir="rtl"
                  className={cn(isClassical && 'ps-12 text-left')}
                >
                  {highlightRegex ? highlightVerse(ajuz, highlightRegex) : ajuz}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
