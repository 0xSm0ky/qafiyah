import { describe, expect, it } from 'vitest';

import { SCHEMA_ORG_CONTEXT } from '@/lib/constants/site-meta';

import { personNode } from './person';
import { buildThingRef } from './thing-ref';

const validInput = {
  name: 'المتنبي',
  url: 'https://qafiyah.com/poets/mutanabbi',
  description: 'ديوان المتنبي',
  mainEntityOfPage: {
    '@type': 'CollectionPage' as const,
    name: 'ديوان المتنبي',
    url: 'https://qafiyah.com/poets/mutanabbi',
  },
};

describe('personNode', () => {
  it('builds a valid Person document', () => {
    const doc = personNode(validInput);
    expect(doc['@context']).toBe(SCHEMA_ORG_CONTEXT);
    expect(doc['@type']).toBe('Person');
    expect(doc.mainEntityOfPage['@type']).toBe('CollectionPage');
  });

  it('throws when description is empty', () => {
    expect(() => personNode({ ...validInput, description: '' })).toThrow();
  });

  it('derives @id matching a Person ref for the same url (regression: used to be a blank node)', () => {
    const doc = personNode(validInput);
    const ref = buildThingRef({ '@type': 'Person', name: validInput.name, url: validInput.url });
    expect(doc['@id']).toBe('https://qafiyah.com/poets/mutanabbi#person');
    expect(doc['@id']).toBe(ref['@id']);
  });
});
