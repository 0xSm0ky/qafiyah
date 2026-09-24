import * as v from 'valibot';

import { SITE_URL } from '@/lib/constants/config';
import {
  GITHUB_REPO_URL,
  SITE_LOGO_PATH,
  SITE_NAME_AR,
  TELEGRAM_HANDLE_URL,
  X_HANDLE_URL,
} from '@/lib/constants/site-meta';

import { absoluteUrl, parseNode, withContext, type JsonLdDocument } from './document';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const imageObjectSchema = v.object({
  '@type': v.literal('ImageObject'),
  url: absoluteUrl,
  width: v.number(),
  height: v.number(),
});

export const organizationSchema = v.object({
  '@type': v.literal('Organization'),
  '@id': v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  url: absoluteUrl,
  logo: imageObjectSchema,
  sameAs: v.array(absoluteUrl),
});

export type OrganizationNode = v.InferOutput<typeof organizationSchema>;
export type OrganizationDoc = JsonLdDocument<OrganizationNode>;

function buildOrganizationFields(): OrganizationNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME_AR,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${SITE_LOGO_PATH}`,
      width: 512,
      height: 512,
    },
    sameAs: [X_HANDLE_URL, GITHUB_REPO_URL, TELEGRAM_HANDLE_URL],
  };
}

export function organizationNode(): OrganizationDoc {
  return withContext(parseNode(organizationSchema, buildOrganizationFields(), 'organizationNode'));
}

export function organizationRef(): OrganizationNode {
  return parseNode(organizationSchema, buildOrganizationFields(), 'organizationRef');
}
