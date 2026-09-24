import { join } from 'node:path';

import { INSPECTOR_PORT, WEB_BASE_URL } from './env';
import { pageMetadataInspector } from './inspectors/page-metadata';
import { renderReport } from './render';
import { discoverRouteShapes, type RouteShape } from './route-discovery';
import { crawlForSamples } from './site-crawl';

import type { Inspector, PageSubject } from './inspector';

const REPO_ROOT = join(import.meta.dir, '../../..');

const INSPECTORS: readonly Inspector[] = [pageMetadataInspector];

const PREFERRED_SAMPLES: Readonly<Record<string, string>> = {
  'poets/[slug]': '/poets/GuRy',
};

const SHAPE_ORDER = [
  '/',
  'about',
  'developers',
  'poets',
  'poets/[slug]',
  'poems/[slug]',
  'meters',
  'meters/[slug]',
  'rhymes',
  'rhymes/[slug]',
  'themes',
  'themes/[slug]',
  'collections',
  'collections/[slug]',
  'login',
  'account',
  '404',
];

function shapeRank(shape: string): number {
  const index = SHAPE_ORDER.indexOf(shape);
  return index === -1 ? SHAPE_ORDER.length : index;
}

function byShapeOrder<T extends { readonly shape: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => shapeRank(a.shape) - shapeRank(b.shape));
}

export async function buildReportForShapes(
  shapes: readonly RouteShape[],
  fetchHtml: (path: string) => Promise<string>,
  webBaseUrl: string,
  preferredSamples: Readonly<Record<string, string>> = {}
): Promise<string> {
  const { resolved, unresolved } = await crawlForSamples(shapes, fetchHtml, preferredSamples);
  const sections = byShapeOrder(resolved).map((page) => {
    const subject: PageSubject = { shape: page.shape, path: page.path, html: page.html };
    return {
      shape: page.shape,
      path: page.path,
      inspectorResults: INSPECTORS.map((inspector) => ({
        title: inspector.title,
        fields: inspector.inspect(subject),
      })),
    };
  });
  const unresolvedShapes = byShapeOrder(unresolved.map((shape) => ({ shape }))).map(
    (entry) => entry.shape
  );
  return renderReport({ webBaseUrl, sections, unresolvedShapes });
}

async function fetchLiveHtml(path: string): Promise<string> {
  const response = await fetch(`${WEB_BASE_URL}${path}`);
  return await response.text();
}

export function buildReport(): Promise<string> {
  const shapes = discoverRouteShapes(REPO_ROOT);
  return buildReportForShapes(shapes, fetchLiveHtml, WEB_BASE_URL, PREFERRED_SAMPLES);
}

if (import.meta.main) {
  Bun.serve({
    port: INSPECTOR_PORT,
    async fetch() {
      const html = await buildReport();
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    },
  });
  console.error(`inspector ready on http://localhost:${INSPECTOR_PORT}`);
}
