import { describe, expect, it } from 'vitest';

import { buildThingRef } from './thing-ref';

describe('buildThingRef', () => {
  it('builds a valid Person ref', () => {
    const ref = buildThingRef({
      '@type': 'Person',
      name: 'المتنبي',
      url: 'https://qafiyah.com/poets/mutanabbi',
    });
    expect(ref.name).toBe('المتنبي');
  });

  it('allows an optional description on Collection and CreativeWork', () => {
    const collection = buildThingRef({
      '@type': 'Collection',
      name: 'ديوان',
      url: 'https://qafiyah.com/collections/x',
      description: 'وصف',
    });
    expect(collection.description).toBe('وصف');
  });

  it('throws when name is empty', () => {
    expect(() =>
      buildThingRef({ '@type': 'Person', name: '', url: 'https://qafiyah.com/poets/x' })
    ).toThrow();
  });

  it('throws when url is not absolute', () => {
    expect(() =>
      buildThingRef({ '@type': 'CollectionPage', name: 'ديوان', url: '/poets/x' })
    ).toThrow();
  });

  it('derives @id from the url and @type (regression: refs used to be blank nodes)', () => {
    const ref = buildThingRef({
      '@type': 'Person',
      name: 'المتنبي',
      url: 'https://qafiyah.com/poets/mutanabbi',
    });
    expect(ref['@id']).toBe('https://qafiyah.com/poets/mutanabbi#person');
  });

  it('gives different @types anchored at the same url distinct ids', () => {
    const url = 'https://qafiyah.com/poets/mutanabbi';
    const person = buildThingRef({ '@type': 'Person', name: 'x', url });
    const collection = buildThingRef({ '@type': 'Collection', name: 'x', url });
    expect(person['@id']).not.toBe(collection['@id']);
  });
});
