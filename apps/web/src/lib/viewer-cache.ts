import { VIEWER_STORAGE_KEY } from '@/lib/constants/config';

export type Viewer = {
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly avatarData: string | null;
  readonly avatarFailedAt: number | null;
};

export type ViewerState =
  | { readonly kind: 'pending' }
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'signed-in'; readonly viewer: Viewer };

export function readCachedViewer(storage: Pick<Storage, 'getItem'>): Viewer | undefined {
  try {
    const raw = storage.getItem(VIEWER_STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the object check above is the guard, the cast only names the index type
    const { displayName, avatarUrl, avatarData, avatarFailedAt } = parsed as Record<
      string,
      unknown
    >;
    return {
      displayName: typeof displayName === 'string' ? displayName : null,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
      avatarData:
        typeof avatarData === 'string' && avatarData.startsWith('data:image/') ? avatarData : null,
      avatarFailedAt: typeof avatarFailedAt === 'number' ? avatarFailedAt : null,
    };
  } catch {
    return undefined;
  }
}

export function isReady(viewer: Viewer): boolean {
  return viewer.avatarUrl === null || viewer.avatarData !== null || viewer.avatarFailedAt !== null;
}

export function initialOf(viewer: Viewer): string {
  return viewer.displayName?.trim().charAt(0).toUpperCase() ?? '';
}

export function stateFromSnapshot(
  getStorage: () => Pick<Storage, 'getItem'>,
  snapshot: string | null
): ViewerState {
  if (snapshot === null) return { kind: 'pending' };
  if (snapshot === 'anonymous') return { kind: 'anonymous' };
  const viewer = readCachedViewer(getStorage());
  if (viewer === undefined || !isReady(viewer)) return { kind: 'loading' };
  return { kind: 'signed-in', viewer };
}
