import * as v from 'valibot';

import { SITE_URL } from '@/lib/constants/config';
import {
  POEM_LANGUAGE,
  SITE_DESCRIPTION,
  SITE_NAME_AR,
  SITE_TAGLINE_AR,
} from '@/lib/constants/site-meta';

import { absoluteUrl, parseNode, withContext, type JsonLdDocument } from './document';
import { organizationRef, organizationSchema } from './organization';

const WEBSITE_ID = `${SITE_URL}/#website`;

const searchActionSchema = v.object({
  '@type': v.literal('SearchAction'),
  target: v.pipe(v.string(), v.minLength(1)),
  'query-input': v.pipe(v.string(), v.minLength(1)),
});

export const websiteRefSchema = v.object({
  '@type': v.literal('WebSite'),
  '@id': v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
});

const websiteNodeSchema = v.intersect([
  websiteRefSchema,
  v.object({
    alternateName: v.pipe(v.string(), v.minLength(1)),
    description: v.pipe(v.string(), v.minLength(1)),
    inLanguage: v.pipe(v.string(), v.minLength(1)),
    publisher: organizationSchema,
    potentialAction: searchActionSchema,
  }),
]);

export type WebSiteRefNode = v.InferOutput<typeof websiteRefSchema>;
type WebSiteNode = v.InferOutput<typeof websiteNodeSchema>;
export type WebSiteDoc = JsonLdDocument<WebSiteNode>;

function buildWebsiteRefFields(): WebSiteRefNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME_AR,
    url: `${SITE_URL}/`,
  };
}

export function websiteRef(): WebSiteRefNode {
  return parseNode(websiteRefSchema, buildWebsiteRefFields(), 'websiteRef');
}

export function websiteNode(): WebSiteDoc {
  const fields: WebSiteNode = {
    ...buildWebsiteRefFields(),
    alternateName: SITE_TAGLINE_AR,
    description: SITE_DESCRIPTION,
    inLanguage: POEM_LANGUAGE,
    publisher: organizationRef(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  return withContext(parseNode(websiteNodeSchema, fields, 'websiteNode'));
}
