import * as v from 'valibot';

import { absoluteUrl, nodeId, parseNode } from './document';

const idField = v.optional(v.pipe(v.string(), v.minLength(1)));

export const personRefSchema = v.object({
  '@type': v.literal('Person'),
  '@id': idField,
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
});
export type PersonRef = v.InferOutput<typeof personRefSchema>;

export const collectionRefSchema = v.object({
  '@type': v.literal('Collection'),
  '@id': idField,
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  description: v.optional(v.pipe(v.string(), v.minLength(1))),
});
export type CollectionRef = v.InferOutput<typeof collectionRefSchema>;

export const collectionPageRefSchema = v.object({
  '@type': v.literal('CollectionPage'),
  '@id': idField,
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
});
export type CollectionPageRef = v.InferOutput<typeof collectionPageRefSchema>;

const creativeWorkRefSchema = v.object({
  '@type': v.literal('CreativeWork'),
  '@id': idField,
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  description: v.optional(v.pipe(v.string(), v.minLength(1))),
});
export type CreativeWorkRef = v.InferOutput<typeof creativeWorkRefSchema>;

const thingRefSchema = v.variant('@type', [
  personRefSchema,
  collectionRefSchema,
  collectionPageRefSchema,
  creativeWorkRefSchema,
]);

export type ThingRef = v.InferOutput<typeof thingRefSchema>;

export function buildThingRef<T extends ThingRef>(ref: T): T & { readonly '@id': string } {
  const withId = { ...ref, '@id': ref['@id'] ?? nodeId(ref.url, ref['@type'].toLowerCase()) };
  parseNode(thingRefSchema, withId, `thingRef(${ref['@type']})`);
  return withId;
}
