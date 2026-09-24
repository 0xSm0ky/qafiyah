export function shardCount(total: number, perShard: number): number {
  return Math.max(1, Math.ceil(total / perShard));
}

type PageResult<T> = { readonly slugs: readonly T[]; readonly totalPages: number };

export async function collectPagedSlugs<T>(
  fetchPage: (page: number) => Promise<PageResult<T> | null>
): Promise<T[]> {
  const first = await fetchPage(1);
  if (!first) return [];
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => fetchPage(i + 2))
  );
  const slugs: T[] = [...first.slugs];
  for (const page of rest) {
    if (page) slugs.push(...page.slugs);
  }
  return slugs;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export type SitemapEntry = { readonly loc: string; readonly imageLoc?: string | undefined };

const IMAGE_NAMESPACE = ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';

function entryXml(entry: SitemapEntry): string {
  const image =
    entry.imageLoc === undefined
      ? ''
      : `<image:image><image:loc>${escapeXml(entry.imageLoc)}</image:loc></image:image>`;
  return `<url><loc>${escapeXml(entry.loc)}</loc>${image}</url>`;
}

export function urlsetXml(entries: readonly (string | SitemapEntry)[]): string {
  const normalized = entries.map((entry) => (typeof entry === 'string' ? { loc: entry } : entry));
  const namespace = normalized.some((entry) => entry.imageLoc !== undefined) ? IMAGE_NAMESPACE : '';
  const body = normalized.map((entry) => entryXml(entry)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${namespace}>${body}</urlset>`;
}

export function sitemapIndexXml(baseUrl: string, sitemapPaths: readonly string[]): string {
  const body = sitemapPaths
    .map((path) => `<sitemap><loc>${escapeXml(`${baseUrl}${path}`)}</loc></sitemap>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
