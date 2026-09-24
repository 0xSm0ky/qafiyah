import { describe, expect, it } from 'vitest';

import { searchQueryKey, searchQueryParams } from './search-query';

const base = {
  q: 'حب',
  page: 1,
  eras: [],
  meters: [],
  rhymes: [],
  themes: [],
  collections: [],
  exact: false,
} as const;

describe('searchQueryParams', () => {
  it('sends only the requested section and pages it', () => {
    expect(searchQueryParams({ ...base, type: 'poems', page: 2, eras: ['jahili'] })).toStrictEqual({
      q: 'حب',
      types: ['poems'],
      poemsPage: '2',
      poetsPage: '1',
      eraSlugs: ['jahili'],
      meterSlugs: [],
      rhymeSlugs: [],
      themeSlugs: [],
      collectionSlugs: [],
      poetSlugs: [],
      exact: 'false',
    });
  });

  it('pages the poets section on its own param', () => {
    const params = searchQueryParams({ ...base, type: 'poets', page: 3 });
    expect(params.poetsPage).toBe('3');
    expect(params.poemsPage).toBe('1');
    expect(params.types).toStrictEqual(['poets']);
  });

  it('blanks the poem-only facets for a poets request, which the API rejects', () => {
    const params = searchQueryParams({
      ...base,
      type: 'poets',
      meters: ['altawil'],
      rhymes: ['meem'],
      themes: ['alnasib'],
      collections: ['almuallaqat'],
      eras: ['jahili'],
    });
    expect(params.meterSlugs).toStrictEqual([]);
    expect(params.rhymeSlugs).toStrictEqual([]);
    expect(params.themeSlugs).toStrictEqual([]);
    expect(params.collectionSlugs).toStrictEqual([]);
    expect(params.eraSlugs).toStrictEqual(['jahili']);
  });

  it('passes exact through as the literal the API declares', () => {
    expect(searchQueryParams({ ...base, type: 'poems', exact: true }).exact).toBe('true');
  });
});

describe('searchQueryKey', () => {
  it('keys poems and poets separately', () => {
    expect(searchQueryKey({ ...base, type: 'poems' })).not.toStrictEqual(
      searchQueryKey({ ...base, type: 'poets' })
    );
  });

  it('does not vary with the page, which useInfiniteQuery manages', () => {
    expect(searchQueryKey({ ...base, type: 'poems', page: 1 })).toStrictEqual(
      searchQueryKey({ ...base, type: 'poems', page: 5 })
    );
  });
});
