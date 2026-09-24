import * as v from 'valibot';

import { SITE_URL } from '@/lib/constants/config';

import { absoluteUrl, parseNode, withContext, type JsonLdDocument } from './document';

export type BreadcrumbItem = {
  readonly name: string;
  readonly path: string;
};

const breadcrumbListItemSchema = v.object({
  '@type': v.literal('ListItem'),
  position: v.pipe(v.number(), v.minValue(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  item: absoluteUrl,
});

const breadcrumbListSchema = v.object({
  '@type': v.literal('BreadcrumbList'),
  itemListElement: v.pipe(v.array(breadcrumbListItemSchema), v.minLength(1)),
});

type BreadcrumbListNode = v.InferOutput<typeof breadcrumbListSchema>;
export type BreadcrumbListDoc = JsonLdDocument<BreadcrumbListNode>;

function absolutize(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

export function buildBreadcrumbList(items: readonly BreadcrumbItem[]): BreadcrumbListDoc {
  return withContext(
    parseNode(
      breadcrumbListSchema,
      {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem' as const,
          position: index + 1,
          name: item.name,
          item: absolutize(item.path),
        })),
      },
      'buildBreadcrumbList'
    )
  );
}
