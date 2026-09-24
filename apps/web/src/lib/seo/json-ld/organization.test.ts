import { describe, expect, it } from 'vitest';

import { SCHEMA_ORG_CONTEXT } from '@/lib/constants/site-meta';

import { organizationNode, organizationRef } from './organization';

describe('organizationNode', () => {
  it('is a root document with the Organization shape', () => {
    const node = organizationNode();
    expect(node['@context']).toBe(SCHEMA_ORG_CONTEXT);
    expect(node['@type']).toBe('Organization');
    expect(node.logo['@type']).toBe('ImageObject');
  });
});

describe('organizationRef', () => {
  it('has no @context', () => {
    expect('@context' in organizationRef()).toBe(false);
  });

  it('shares identical name, id, logo, and sameAs with organizationNode (regression: these used to drift across files)', () => {
    const node = organizationNode();
    const ref = organizationRef();
    expect(ref['@id']).toBe(node['@id']);
    expect(ref.name).toBe(node.name);
    expect(ref.url).toBe(node.url);
    expect(ref.logo).toEqual(node.logo);
    expect(ref.sameAs).toEqual(node.sameAs);
  });
});
