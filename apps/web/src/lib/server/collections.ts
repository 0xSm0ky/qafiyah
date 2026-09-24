import { apiServer } from './client';
import { getOrNull, unwrap } from './unwrap';

import type { Ok } from './types';
import type { CollectionSlug } from '@/lib/api/brands';

export type Collection = Ok<'/collections/{slug}'>['data'];

export const allCollections = (): Promise<Ok<'/collections'>['data']> =>
  unwrap(() => apiServer.GET('/collections'));

export const getCollection = (slug: CollectionSlug): Promise<Collection | null> =>
  getOrNull(() => apiServer.GET('/collections/{slug}', { params: { path: { slug } } }));
