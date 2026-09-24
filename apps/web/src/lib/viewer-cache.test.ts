import { describe, expect, it } from 'vitest';

import { VIEWER_STORAGE_KEY } from '@/lib/constants/config';

import { initialOf, isReady, readCachedViewer, stateFromSnapshot } from './viewer-cache';

function storage(entries: Readonly<Record<string, string>> = {}) {
  return {
    getItem: (key: string) => entries[key] ?? null,
  } as Pick<Storage, 'getItem'>;
}

describe('readCachedViewer', () => {
  it('reads and normalizes a valid cached viewer', () => {
    const s = storage({
      [VIEWER_STORAGE_KEY]: JSON.stringify({
        displayName: 'أحمد',
        avatarUrl: 'https://x.test/a.png',
        avatarData: 'data:image/webp;base64,AAAA',
        avatarFailedAt: null,
      }),
    });
    expect(readCachedViewer(s)).toEqual({
      displayName: 'أحمد',
      avatarUrl: 'https://x.test/a.png',
      avatarData: 'data:image/webp;base64,AAAA',
      avatarFailedAt: null,
    });
  });

  it('returns undefined for missing, corrupt, or non-object data', () => {
    expect(readCachedViewer(storage())).toBeUndefined();
    expect(readCachedViewer(storage({ [VIEWER_STORAGE_KEY]: '{corrupt' }))).toBeUndefined();
    expect(readCachedViewer(storage({ [VIEWER_STORAGE_KEY]: '"a string"' }))).toBeUndefined();
  });

  it('rejects an avatarData that is not a data image', () => {
    const s = storage({
      [VIEWER_STORAGE_KEY]: JSON.stringify({
        avatarUrl: 'https://x.test/a.png',
        avatarData: 'javascript:alert(1)',
      }),
    });
    expect(readCachedViewer(s)?.avatarData).toBeNull();
  });
});

describe('isReady', () => {
  const base = { displayName: null, avatarUrl: null, avatarData: null, avatarFailedAt: null };
  it('is ready immediately when there is no avatar to fetch', () => {
    expect(isReady(base)).toBe(true);
  });
  it('is not ready while an avatar is still pending', () => {
    expect(isReady({ ...base, avatarUrl: 'https://x.test/a.png' })).toBe(false);
  });
  it('is ready once the avatar data or a failure is cached', () => {
    expect(
      isReady({
        ...base,
        avatarUrl: 'https://x.test/a.png',
        avatarData: 'data:image/webp;base64,AAAA',
      })
    ).toBe(true);
    expect(isReady({ ...base, avatarUrl: 'https://x.test/a.png', avatarFailedAt: 123 })).toBe(true);
  });
});

describe('initialOf', () => {
  it('returns the uppercase first letter of the display name', () => {
    expect(
      initialOf({ displayName: 'ahmed', avatarUrl: null, avatarData: null, avatarFailedAt: null })
    ).toBe('A');
  });
  it('returns an empty string with no display name', () => {
    expect(
      initialOf({ displayName: null, avatarUrl: null, avatarData: null, avatarFailedAt: null })
    ).toBe('');
  });
});

describe('stateFromSnapshot', () => {
  it('maps null to pending and anonymous to anonymous', () => {
    expect(stateFromSnapshot(() => storage(), null)).toEqual({ kind: 'pending' });
    expect(stateFromSnapshot(() => storage(), 'anonymous')).toEqual({ kind: 'anonymous' });
  });
  it('maps a ready cached viewer to signed-in', () => {
    const s = storage({
      [VIEWER_STORAGE_KEY]: JSON.stringify({
        displayName: 'أ',
        avatarUrl: null,
        avatarData: null,
        avatarFailedAt: null,
      }),
    });
    const state = stateFromSnapshot(() => s, 'signed-in');
    expect(state.kind).toBe('signed-in');
  });
  it('maps an absent or unready viewer to loading', () => {
    expect(stateFromSnapshot(() => storage(), 'anything')).toEqual({ kind: 'loading' });
  });
});
