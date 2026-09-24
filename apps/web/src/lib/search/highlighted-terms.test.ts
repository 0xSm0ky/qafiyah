import { describe, expect, it } from 'vitest';

import { highlightedTerms, splitHighlightedParts } from './highlighted-terms';

describe('highlightedTerms', () => {
  it('collects each distinct marked term in order', () => {
    expect(highlightedTerms('<mark>حب</mark> و<mark>حرب</mark>')).toEqual(['حب', 'حرب']);
  });

  it('deduplicates repeated terms', () => {
    expect(highlightedTerms('<mark>حب</mark> و<mark>حب</mark>')).toEqual(['حب']);
  });

  it('returns nothing when there are no marks', () => {
    expect(highlightedTerms('نص بلا تحديد')).toEqual([]);
  });
});

describe('splitHighlightedParts', () => {
  it('alternates unmarked and marked parts', () => {
    expect(splitHighlightedParts('قبل <mark>داخل</mark> بعد')).toEqual(['قبل ', 'داخل', ' بعد']);
  });
});
