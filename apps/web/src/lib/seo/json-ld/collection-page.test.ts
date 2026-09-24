import { describe, expect, it } from 'vitest';

import { SCHEMA_ORG_CONTEXT } from '@/lib/constants/site-meta';

import { collectionPageNode } from './collection-page';
import { buildItemList } from './item-list';
import { buildThingRef } from './thing-ref';
import { websiteRef } from './website';

describe('collectionPageNode', () => {
  it('builds a valid CollectionPage document with an ItemList mainEntity', () => {
    const doc = collectionPageNode({
      name: 'قائمة الشعراء',
      url: 'https://qafiyah.com/poets',
      description: 'وصف',
      isPartOf: websiteRef(),
      mainEntity: buildItemList([
        buildThingRef({
          '@type': 'Person',
          name: 'المتنبي',
          url: 'https://qafiyah.com/poets/mutanabbi',
        }),
      ]),
    });
    expect(doc['@context']).toBe(SCHEMA_ORG_CONTEXT);
    expect(doc.mainEntity.numberOfItems).toBe(1);
    expect(doc.mainEntity.itemListElement[0]?.item['@type']).toBe('Person');
  });

  it('throws when description is empty', () => {
    expect(() =>
      collectionPageNode({
        name: 'قائمة الشعراء',
        url: 'https://qafiyah.com/poets',
        description: '',
        isPartOf: websiteRef(),
        mainEntity: buildItemList([]),
      })
    ).toThrow();
  });

  it('derives @id from url (regression: used to be a blank node)', () => {
    const doc = collectionPageNode({
      name: 'قائمة الشعراء',
      url: 'https://qafiyah.com/poets',
      description: 'وصف',
      isPartOf: websiteRef(),
      mainEntity: buildItemList([]),
    });
    expect(doc['@id']).toBe('https://qafiyah.com/poets#collectionpage');
  });
});
