import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { SCHEMA_ORG_CONTEXT } from '@/lib/constants/site-meta';

import { absoluteUrl, nodeId, parseNode, withContext } from './document';

describe('absoluteUrl', () => {
  it('accepts an absolute URL', () => {
    expect(v.parse(absoluteUrl, 'https://qafiyah.com/poets')).toBe('https://qafiyah.com/poets');
  });

  it('rejects a relative path', () => {
    expect(v.safeParse(absoluteUrl, '/poets').success).toBe(false);
  });
});

describe('withContext', () => {
  it('adds @context without mutating the original node', () => {
    const node = { '@type': 'Thing', name: 'x' } as const;
    const doc = withContext(node);
    expect(doc['@context']).toBe(SCHEMA_ORG_CONTEXT);
    expect(doc.name).toBe('x');
    expect('@context' in node).toBe(false);
  });
});

describe('nodeId', () => {
  it('appends a type fragment to the url', () => {
    expect(nodeId('https://qafiyah.com/poets/mutanabbi', 'person')).toBe(
      'https://qafiyah.com/poets/mutanabbi#person'
    );
  });

  it('gives different types anchored at the same url distinct ids', () => {
    const url = 'https://qafiyah.com/poets/mutanabbi';
    expect(nodeId(url, 'person')).not.toBe(nodeId(url, 'collection'));
  });
});

describe('parseNode', () => {
  const schema = v.object({ name: v.pipe(v.string(), v.minLength(1)) });

  it('returns the parsed value on success', () => {
    expect(parseNode(schema, { name: 'a' }, 'test')).toEqual({ name: 'a' });
  });

  it('throws a descriptive error including the label on failure', () => {
    expect(() => parseNode(schema, { name: '' }, 'test-label')).toThrow(/test-label/);
  });
});
