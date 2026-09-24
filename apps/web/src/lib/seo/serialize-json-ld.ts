import type { BreadcrumbListDoc } from '@/lib/seo/json-ld/breadcrumb-list';
import type { CollectionPageDoc } from '@/lib/seo/json-ld/collection-page';
import type { JsonLdDocument } from '@/lib/seo/json-ld/document';
import type { ItemListNode } from '@/lib/seo/json-ld/item-list';
import type { OrganizationDoc } from '@/lib/seo/json-ld/organization';
import type { PersonDoc } from '@/lib/seo/json-ld/person';
import type { PoemArticleDoc } from '@/lib/seo/json-ld/poem-article';
import type { ThingRef } from '@/lib/seo/json-ld/thing-ref';
import type { WebSiteDoc } from '@/lib/seo/json-ld/website';

export type AnyJsonLdDoc =
  | OrganizationDoc
  | WebSiteDoc
  | PersonDoc
  | PoemArticleDoc
  | CollectionPageDoc<ThingRef>
  | JsonLdDocument<ItemListNode<ThingRef>>
  | BreadcrumbListDoc;

export function serializeJsonLd(entry: AnyJsonLdDoc): string {
  return JSON.stringify(entry)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
