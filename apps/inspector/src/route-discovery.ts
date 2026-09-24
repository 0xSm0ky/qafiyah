import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export type RouteShape = {
  readonly shape: string;
  readonly isDynamic: boolean;
  readonly staticPath: string | null;
  readonly pattern: RegExp | null;
};

const SKIPPED_BASENAMES = new Set(['500.astro']);
const ASTRO_EXT = '.astro';

const isDynamicSegment = (segment: string): boolean =>
  segment.startsWith('[') && segment.endsWith(']');

const escapeRegExp = (value: string): string => value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

function reservedSiblingsByDir(relativeFiles: readonly string[]): Map<string, Set<string>> {
  const reserved = new Map<string, Set<string>>();
  for (const file of relativeFiles) {
    const lastDot = file.lastIndexOf('.');
    if (lastDot < 0) continue;
    const segments = file.slice(0, lastDot).split('/');
    const last = segments.at(-1) ?? '';
    if (last === '' || last === 'index' || isDynamicSegment(last)) continue;
    const dir = segments.slice(0, -1).join('/');
    const names = reserved.get(dir) ?? new Set<string>();
    names.add(last);
    reserved.set(dir, names);
  }
  return reserved;
}

export function shapesFromPageFiles(relativeFiles: readonly string[]): RouteShape[] {
  const reserved = reservedSiblingsByDir(relativeFiles);
  const shapes: RouteShape[] = [];
  for (const file of relativeFiles) {
    if (!file.endsWith(ASTRO_EXT)) continue;
    const basename = file.split('/').at(-1) ?? file;
    if (SKIPPED_BASENAMES.has(basename)) continue;

    const withoutExt = file.slice(0, -ASTRO_EXT.length);
    const segments = withoutExt.split('/').filter((segment) => segment !== 'index');
    const shape = segments.length === 0 ? '/' : segments.join('/');
    const isDynamic = segments.some((segment) => isDynamicSegment(segment));

    if (isDynamic) {
      const dir = withoutExt.split('/').slice(0, -1).join('/');
      const names = reserved.get(dir);
      const exclusion =
        names && names.size > 0
          ? `(?!${[...names].map((name) => escapeRegExp(name)).join('|')}$)`
          : '';
      const patternSegments = segments.map((segment) =>
        isDynamicSegment(segment) ? `${exclusion}[^/]+` : segment
      );
      shapes.push({
        shape,
        isDynamic: true,
        staticPath: null,
        pattern: new RegExp(`^/${patternSegments.join('/')}$`),
      });
    } else {
      shapes.push({
        shape,
        isDynamic: false,
        staticPath: shape === '/' ? '/' : `/${shape}`,
        pattern: null,
      });
    }
  }
  return shapes;
}

function listPageFiles(pagesDir: string): string[] {
  const results: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        results.push(relative(pagesDir, full).split(sep).join('/'));
      }
    }
  };
  walk(pagesDir);
  return results.sort();
}

export function discoverRouteShapes(repoRoot: string): RouteShape[] {
  const pagesDir = join(repoRoot, 'apps/web/src/pages');
  return shapesFromPageFiles(listPageFiles(pagesDir));
}
