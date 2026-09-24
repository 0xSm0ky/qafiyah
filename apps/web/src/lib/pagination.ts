import { toArabicDigits } from '@/lib/arabic';

const POSITIVE_INTEGER_RE = /^\d+$/;

export function parsePageParam(raw: string | undefined): number | null {
  if (raw === undefined || !POSITIVE_INTEGER_RE.test(raw)) return null;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : null;
}

export function parsePageQuery(raw: string | null): number | null {
  if (raw === null) return 1;
  if (!POSITIVE_INTEGER_RE.test(raw)) return null;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 2 ? page : null;
}

type Pagination = {
  readonly page: number;
  readonly totalPages: number;
};

export type PaginationView = {
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
  readonly nextPageUrl: string;
  readonly prevPageUrl: string;
  readonly headerTip: string;
};

export function derivePagination(
  pagination: Pagination,
  makeUrl: (page: number) => string
): PaginationView {
  const pageNumber = pagination.page;
  const totalPages = pagination.totalPages;
  return {
    pageNumber,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPrevPage: pageNumber > 1,
    nextPageUrl: makeUrl(pageNumber + 1),
    prevPageUrl: makeUrl(pageNumber - 1),
    headerTip: `صـ ${toArabicDigits(pageNumber)} من ${toArabicDigits(totalPages)}`,
  };
}
