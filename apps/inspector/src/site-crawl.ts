import type { RouteShape } from './route-discovery';

type ResolvedPage = {
  readonly shape: string;
  readonly path: string;
  readonly html: string;
};

export type CrawlResult = {
  readonly resolved: ResolvedPage[];
  readonly unresolved: readonly string[];
};

const MAX_FETCHES = 30;
const HREF_RE = /href=["']([^"']+)["']/g;
const SENTINEL_HREF_RE = /\/ghayrmaruf$/;
const PLACEHOLDER_H1_RE = /<h1\b[^>]*>\s*غير معروف\s*</;
const CANONICAL_RE = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i;

function isSentinelHref(href: string): boolean {
  return SENTINEL_HREF_RE.test(href);
}

function canonicalPath(html: string): string | null {
  const href = CANONICAL_RE.exec(html)?.[1];
  if (href === undefined) return null;
  return URL.canParse(href) ? new URL(href).pathname : href;
}

export function isUsableSample(html: string, path: string): boolean {
  if (PLACEHOLDER_H1_RE.test(html)) return false;
  const canonical = canonicalPath(html);
  return canonical === null || canonical === path;
}

export function extractInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  for (const match of html.matchAll(HREF_RE)) {
    const raw = match[1];
    if (raw === undefined || raw === '' || !raw.startsWith('/')) continue;
    const withoutHash = raw.split('#')[0] ?? raw;
    const withoutQuery = withoutHash.split('?')[0] ?? withoutHash;
    if (withoutQuery) hrefs.push(withoutQuery);
  }
  return hrefs;
}

export async function crawlForSamples(
  shapes: readonly RouteShape[],
  fetchHtml: (path: string) => Promise<string>,
  preferredSamples: Readonly<Record<string, string>> = {}
): Promise<CrawlResult> {
  const staticShapes = shapes.filter((shape) => !shape.isDynamic);
  const remainingDynamic = new Map(
    shapes.filter((shape) => shape.isDynamic).map((shape) => [shape.shape, shape] as const)
  );

  const resolved: ResolvedPage[] = [];
  const visited = new Set<string>();
  let fetchCount = 0;
  const queue: string[] = [
    ...[...remainingDynamic.keys()]
      .map((shape) => preferredSamples[shape])
      .filter((path): path is string => path !== undefined),
    ...staticShapes
      .map((shape) => shape.staticPath)
      .filter((path): path is string => path !== null),
  ];

  while (queue.length > 0 && fetchCount < MAX_FETCHES) {
    const path = queue.shift();
    if (path === undefined || visited.has(path)) continue;
    visited.add(path);

    const matchedStatic = staticShapes.find((shape) => shape.staticPath === path);
    const matchedDynamic = [...remainingDynamic.entries()].find(
      ([, shape]) => shape.pattern?.test(path) ?? false
    );
    if (!matchedStatic && !matchedDynamic) continue;

    fetchCount += 1;
    const html = await fetchHtml(path);
    const isRejectedDynamic = Boolean(matchedDynamic) && !isUsableSample(html, path);

    if (!isRejectedDynamic) {
      const resolvedShape = matchedStatic?.shape ?? matchedDynamic?.[0] ?? path;
      resolved.push({ shape: resolvedShape, path, html });
      if (matchedDynamic) remainingDynamic.delete(matchedDynamic[0]);
    }

    for (const href of extractInternalHrefs(html)) {
      if (visited.has(href) || queue.includes(href) || isSentinelHref(href)) continue;
      const targetsUnresolvedShape = [...remainingDynamic.values()].some(
        (shape) => shape.pattern?.test(href) ?? false
      );
      if (targetsUnresolvedShape) queue.push(href);
    }
  }

  return {
    resolved,
    unresolved: [...remainingDynamic.keys()],
  };
}
