import * as v from 'valibot';

import { SCHEMA_ORG_CONTEXT } from '@/lib/constants/site-meta';

export const absoluteUrl = v.pipe(v.string(), v.url('must be an absolute URL'));

export type JsonLdDocument<T extends Record<string, unknown>> = T & {
  readonly '@context': typeof SCHEMA_ORG_CONTEXT;
};

export function withContext<T extends Record<string, unknown>>(node: T): JsonLdDocument<T> {
  return { '@context': SCHEMA_ORG_CONTEXT, ...node };
}

export function nodeId(url: string, fragment: string): string {
  return `${url}#${fragment}`;
}

export function parseNode<TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
  label: string
): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, value);
  if (!result.success) {
    throw new Error(`invalid JSON-LD node (${label}): ${v.summarize(result.issues)}`);
  }
  return result.output;
}
