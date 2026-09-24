import { describe, expect, it } from 'vitest';

import { buildPoemArticle } from './poem-article';
import { buildThingRef } from './thing-ref';
import { websiteRef } from './website';

const validInput = {
  name: 'البردة',
  headline: 'البردة - المتنبي',
  author: buildThingRef({
    '@type': 'Person' as const,
    name: 'المتنبي',
    url: 'https://qafiyah.com/poets/mutanabbi',
  }),
  inLanguage: 'ar',
  url: 'https://qafiyah.com/poems/xxxx',
  isPartOf: [
    websiteRef(),
    buildThingRef({
      '@type': 'Collection' as const,
      name: 'المتنبي',
      url: 'https://qafiyah.com/poets/mutanabbi',
    }),
  ],
  description: 'وصف القصيدة',
  text: 'صدر البيت الأول - عجز البيت الأول',
  keywords: 'المديح, الطويل, الباء, العباسي, المتنبي',
};

describe('buildPoemArticle', () => {
  it('embeds a full publisher, including url (regression: publisher used to be missing url)', () => {
    const doc = buildPoemArticle(validInput);
    expect(doc.publisher.url).toBeTruthy();
    expect(doc.publisher.logo['@type']).toBe('ImageObject');
  });

  it('carries the poem body in text and facets in keywords, not the other way round', () => {
    const doc = buildPoemArticle(validInput);
    expect(doc.text).toBe('صدر البيت الأول - عجز البيت الأول');
    expect(doc.description).toBe('وصف القصيدة');
    expect(doc.keywords).toBe('المديح, الطويل, الباء, العباسي, المتنبي');
  });

  it('derives mainEntityOfPage from url', () => {
    const doc = buildPoemArticle(validInput);
    expect(doc.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://qafiyah.com/poems/xxxx',
    });
  });

  it('throws when name is empty', () => {
    expect(() => buildPoemArticle({ ...validInput, name: '' })).toThrow();
  });

  it('derives its own @id from url, distinct from mainEntityOfPage (regression: used to be a blank node)', () => {
    const doc = buildPoemArticle(validInput);
    expect(doc['@id']).toBe('https://qafiyah.com/poems/xxxx#creativework');
    expect(doc['@id']).not.toBe(doc.mainEntityOfPage['@id']);
  });
});
