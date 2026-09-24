import * as v from 'valibot';

import { absoluteUrl, nodeId, parseNode, withContext, type JsonLdDocument } from './document';
import { organizationRef, organizationSchema } from './organization';
import { collectionRefSchema, personRefSchema, type PersonRef } from './thing-ref';
import { websiteRefSchema } from './website';

const webPageRefSchema = v.object({
  '@type': v.literal('WebPage'),
  '@id': absoluteUrl,
});

const poemIsPartOfEntrySchema = v.variant('@type', [websiteRefSchema, collectionRefSchema]);
export type PoemIsPartOfEntry = v.InferOutput<typeof poemIsPartOfEntrySchema>;

const poemArticleSchema = v.object({
  '@type': v.literal('CreativeWork'),
  '@id': v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  headline: v.pipe(v.string(), v.minLength(1)),
  author: personRefSchema,
  inLanguage: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  mainEntityOfPage: webPageRefSchema,
  isPartOf: v.array(poemIsPartOfEntrySchema),
  description: v.pipe(v.string(), v.minLength(1)),
  text: v.pipe(v.string(), v.minLength(1)),
  keywords: v.string(),
  publisher: organizationSchema,
});

type PoemArticleNode = v.InferOutput<typeof poemArticleSchema>;
export type PoemArticleDoc = JsonLdDocument<PoemArticleNode>;

export function buildPoemArticle(input: {
  readonly name: string;
  readonly headline: string;
  readonly author: PersonRef;
  readonly inLanguage: string;
  readonly url: string;
  readonly isPartOf: readonly PoemIsPartOfEntry[];
  readonly description: string;
  readonly text: string;
  readonly keywords: string;
}): PoemArticleDoc {
  return withContext(
    parseNode(
      poemArticleSchema,
      {
        '@type': 'CreativeWork',
        '@id': nodeId(input.url, 'creativework'),
        name: input.name,
        headline: input.headline,
        author: input.author,
        inLanguage: input.inLanguage,
        url: input.url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
        isPartOf: input.isPartOf,
        description: input.description,
        text: input.text,
        keywords: input.keywords,
        publisher: organizationRef(),
      },
      'buildPoemArticle'
    )
  );
}
