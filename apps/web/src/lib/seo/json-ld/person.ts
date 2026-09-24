import * as v from 'valibot';

import { absoluteUrl, nodeId, parseNode, withContext, type JsonLdDocument } from './document';
import { collectionPageRefSchema, type CollectionPageRef } from './thing-ref';

const personNodeSchema = v.object({
  '@type': v.literal('Person'),
  '@id': v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  description: v.pipe(v.string(), v.minLength(1)),
  image: v.optional(absoluteUrl),
  mainEntityOfPage: collectionPageRefSchema,
});

type PersonNode = v.InferOutput<typeof personNodeSchema>;
export type PersonDoc = JsonLdDocument<PersonNode>;

export function personNode(input: {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly image?: string | undefined;
  readonly mainEntityOfPage: CollectionPageRef;
}): PersonDoc {
  return withContext(
    parseNode(
      personNodeSchema,
      {
        '@type': 'Person',
        '@id': nodeId(input.url, 'person'),
        name: input.name,
        url: input.url,
        description: input.description,
        ...(input.image === undefined ? {} : { image: input.image }),
        mainEntityOfPage: input.mainEntityOfPage,
      },
      'personNode'
    )
  );
}
