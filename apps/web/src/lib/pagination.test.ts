import { describe, expect, it } from 'vitest';

import { derivePagination, parsePageParam, parsePageQuery } from './pagination';

describe('parsePageParam', () => {
  it('parses a positive integer string', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('42')).toBe(42);
  });
  it('returns null for undefined, non-numeric, zero, negative, or decimal', () => {
    expect(parsePageParam(undefined)).toBeNull();
    expect(parsePageParam('abc')).toBeNull();
    expect(parsePageParam('0')).toBeNull();
    expect(parsePageParam('-3')).toBeNull();
    expect(parsePageParam('1.5')).toBeNull();
  });
});

describe('parsePageQuery', () => {
  it('treats an absent param as the first page', () => {
    expect(parsePageQuery(null)).toBe(1);
  });
  it('parses a page beyond the first', () => {
    expect(parsePageQuery('2')).toBe(2);
    expect(parsePageQuery('42')).toBe(42);
  });
  it('rejects an explicit page=1 since the first page is the bare URL', () => {
    expect(parsePageQuery('1')).toBeNull();
  });
  it('returns null for non-numeric, zero, negative, or decimal', () => {
    expect(parsePageQuery('abc')).toBeNull();
    expect(parsePageQuery('0')).toBeNull();
    expect(parsePageQuery('-3')).toBeNull();
    expect(parsePageQuery('2.5')).toBeNull();
  });
});

describe('derivePagination', () => {
  const makeUrl = (page: number) => `/x?page=${page}`;

  it('marks both directions available on a middle page', () => {
    const view = derivePagination({ page: 3, totalPages: 5 }, makeUrl);
    expect(view.hasPrevPage).toBe(true);
    expect(view.hasNextPage).toBe(true);
    expect(view.prevPageUrl).toBe('/x?page=2');
    expect(view.nextPageUrl).toBe('/x?page=4');
  });

  it('disables prev on the first page', () => {
    const view = derivePagination({ page: 1, totalPages: 5 }, makeUrl);
    expect(view.hasPrevPage).toBe(false);
    expect(view.hasNextPage).toBe(true);
  });

  it('disables next on the last page', () => {
    const view = derivePagination({ page: 5, totalPages: 5 }, makeUrl);
    expect(view.hasPrevPage).toBe(true);
    expect(view.hasNextPage).toBe(false);
  });

  it('renders the header tip with Arabic digits', () => {
    const view = derivePagination({ page: 2, totalPages: 10 }, makeUrl);
    expect(view.headerTip).toBe('صـ ٢ من ١٠');
  });
});
