import * as v from 'valibot';

import { absoluteUrl, nodeId, parseNode, withContext, type JsonLdDocument } from './document';
import { websiteRefSchema, type WebSiteRefNode } from './website';

import type { ItemListNode } from './item-list';

const itemListShapeSchema = v.object({
  '@type': v.literal('ItemList'),
  name: v.optional(v.pipe(v.string(), v.minLength(1))),
  numberOfItems: v.number(),
  itemListElement: v.array(v.unknown()),
});

const collectionPageSchema = v.object({
  '@type': v.literal('CollectionPage'),
  '@id': v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  description: v.pipe(v.string(), v.minLength(1)),
  isPartOf: websiteRefSchema,
  mainEntity: itemListShapeSchema,
});

type CollectionPageNode<T> = {
  readonly '@type': 'CollectionPage';
  readonly '@id': string;
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly isPartOf: WebSiteRefNode;
  readonly mainEntity: ItemListNode<T>;
};
export type CollectionPageDoc<T> = JsonLdDocument<CollectionPageNode<T>>;

export function collectionPageNode<T>(input: {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly isPartOf: WebSiteRefNode;
  readonly mainEntity: ItemListNode<T>;
}): CollectionPageDoc<T> {
  const fields: CollectionPageNode<T> = {
    '@type': 'CollectionPage',
    '@id': nodeId(input.url, 'collectionpage'),
    ...input,
  };
  parseNode(collectionPageSchema, fields, 'collectionPageNode');
  return withContext(fields);
}
