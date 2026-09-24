import { describe, expect, it } from 'vitest';

import { getBadgeCount, getNoResultsText, getSectionResultText } from './search-format';

describe('getBadgeCount', () => {
  it('formats a count with the given noun forms', () => {
    const forms = { singular: 'قصيدة', dual: 'قصيدتان', plural: 'قصائد' };
    expect(getBadgeCount(3, forms)).toBe('٣ قصائد');
    expect(getBadgeCount(1, forms)).toBe('قصيدة');
  });
});

describe('getNoResultsText', () => {
  it('shows the filter message when no query was committed', () => {
    expect(getNoResultsText({ hasCommittedQuery: false, query: '' })).toBe(
      'لم يُعثر على نتائج بهذه الفلاتر'
    );
  });

  it('quotes the query and strips non-Arabic characters', () => {
    expect(getNoResultsText({ hasCommittedQuery: true, query: 'حب123' })).toContain('حب');
  });

  it('truncates a long query to the display length', () => {
    const text = getNoResultsText({ hasCommittedQuery: true, query: 'ا'.repeat(50) });
    expect(text).toContain('...');
    expect(text).toContain('"');
  });
});

describe('getSectionResultText', () => {
  it('reports the result count', () => {
    expect(getSectionResultText({ count: 5 })).toContain('٥');
  });
});
