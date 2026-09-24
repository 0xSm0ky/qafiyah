import { describe, expect, it } from 'vitest';

import { websiteNode, websiteRef } from './website';

describe('websiteNode', () => {
  it('embeds a full Organization publisher, including logo (upgrade: previously used a name/url-only ref)', () => {
    const node = websiteNode();
    expect(node['@type']).toBe('WebSite');
    expect(node.publisher['@type']).toBe('Organization');
    expect(node.publisher.logo['@type']).toBe('ImageObject');
    expect(node.potentialAction['@type']).toBe('SearchAction');
  });
});

describe('websiteRef', () => {
  it('is a lite reference without @context', () => {
    const ref = websiteRef();
    expect('@context' in ref).toBe(false);
    expect(ref['@type']).toBe('WebSite');
  });
});
