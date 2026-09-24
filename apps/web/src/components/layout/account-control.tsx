import * as React from 'react';

import { VIEWER_HINT_COOKIE, VIEWER_STORAGE_KEY } from '@/lib/constants/config';
import { cn } from '@/lib/utils';
import {
  initialOf,
  readCachedViewer,
  stateFromSnapshot,
  type Viewer,
  type ViewerState,
} from '@/lib/viewer-cache';
import { viewerHintCookie } from '@/lib/viewer-hint';

import type { ViewerPayload } from '@/lib/server/viewer-response';

const AVATAR_PX = 48;
const AVATAR_RETRY_MS = 5 * 60 * 1000;
const AVATAR =
  'bg-surface-sunken text-text-muted inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cover bg-center leading-none';

const SLOT = 'hidden h-8 w-28 items-center justify-end in-data-viewer:inline-flex';
const NAV_ITEM =
  'text-text-muted hover:bg-surface-hover hover:text-text -my-1 -ml-2 inline-flex items-center gap-2 rounded-md px-2 py-1 whitespace-nowrap transition-colors duration-200 focus-ring';
const COMPACT_SLOT =
  'hidden size-5 items-center justify-center xxs:size-6 in-data-viewer:inline-flex';

type Props = {
  readonly compact?: boolean;
};

function hasViewerHint(): boolean {
  return document.cookie.split('; ').includes(`${VIEWER_HINT_COOKIE}=1`);
}

function syncViewerHint(signedIn: boolean): void {
  if (hasViewerHint() !== signedIn) document.cookie = viewerHintCookie(signedIn);
  const root = document.documentElement;
  if (signedIn) root.dataset['viewer'] ??= 'signed-in';
  else delete root.dataset['viewer'];
}

function writeCachedViewer(viewer: Viewer | undefined): void {
  try {
    if (viewer === undefined) localStorage.removeItem(VIEWER_STORAGE_KEY);
    else localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(viewer));
  } catch {}
}

function readSnapshot(): string {
  if (!hasViewerHint()) return 'anonymous';
  try {
    return localStorage.getItem(VIEWER_STORAGE_KEY) ?? 'loading';
  } catch {
    return 'loading';
  }
}

async function encodeAvatar(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob(), {
      resizeWidth: AVATAR_PX,
      resizeHeight: AVATAR_PX,
      resizeQuality: 'high',
    });
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_PX;
    canvas.height = AVATAR_PX;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL('image/webp', 0.9);
  } catch {
    return null;
  }
}

function pickAvatar(viewer: Viewer): Pick<Viewer, 'avatarData' | 'avatarFailedAt'> {
  return { avatarData: viewer.avatarData, avatarFailedAt: viewer.avatarFailedAt };
}

async function resolveAvatar(payload: ViewerPayload): Promise<Viewer> {
  if (payload.avatarUrl === null) return { ...payload, avatarData: null, avatarFailedAt: null };
  const previous = readCachedViewer(localStorage);
  if (previous !== undefined && previous.avatarUrl === payload.avatarUrl) {
    if (previous.avatarData !== null) return { ...payload, ...pickAvatar(previous) };
    const failedAt = previous.avatarFailedAt;
    if (failedAt !== null && Date.now() - failedAt < AVATAR_RETRY_MS) {
      return { ...payload, ...pickAvatar(previous) };
    }
  }
  const avatarData = await encodeAvatar(payload.avatarUrl);
  return { ...payload, avatarData, avatarFailedAt: avatarData === null ? Date.now() : null };
}

const subscribeToNothing = () => () => {};

export function AccountControl({ compact = false }: Props) {
  const snapshot = React.useSyncExternalStore(subscribeToNothing, readSnapshot, () => null);
  const [fetched, setFetched] = React.useState<ViewerState | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        // oxlint-disable-next-line typescript/no-unsafe-assignment -- the /api/me response is the app's own typed contract
        const payload: ViewerPayload | undefined =
          response.status === 204 ? undefined : await response.json();
        if (!active) return;
        syncViewerHint(payload !== undefined);
        if (payload === undefined) {
          writeCachedViewer(undefined);
          setFetched({ kind: 'anonymous' });
          return;
        }
        const viewer = await resolveAvatar(payload);
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- active flips in the effect cleanup during the await above
        if (!active) return;
        writeCachedViewer(viewer);
        setFetched({ kind: 'signed-in', viewer });
      } catch {
        if (active && !hasViewerHint()) setFetched({ kind: 'anonymous' });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const state = fetched ?? stateFromSnapshot(() => localStorage, snapshot);
  if (state.kind === 'anonymous') return null;

  return <span className={compact ? COMPACT_SLOT : SLOT}>{renderState(state, compact)}</span>;
}

function renderKnownViewer(compact: boolean): React.ReactNode {
  const shown = 'hidden in-data-[viewer=signed-in]:inline-flex';
  const avatar = cn(AVATAR, 'bg-(image:--viewer-avatar) before:content-(--viewer-initial)');
  if (compact) {
    return (
      <a
        href="/account"
        rel="nofollow"
        aria-label="حسابي"
        className={cn(shown, avatar, 'size-full text-xs focus-ring')}
      />
    );
  }
  return (
    <a href="/account" rel="nofollow" className={cn(NAV_ITEM, shown)}>
      <span aria-hidden="true" className={cn(avatar, 'size-5 text-[10px]')} />
      حسابي
    </a>
  );
}

function renderSkeleton(compact: boolean, onlyWhileLoading: boolean): React.ReactNode {
  const shown = onlyWhileLoading ? 'hidden in-data-[viewer=loading]:inline-flex' : 'inline-flex';
  if (compact) {
    return (
      <span
        aria-hidden="true"
        className={cn(shown, 'size-full animate-pulse rounded-full bg-surface-sunken')}
      />
    );
  }
  return (
    <span aria-hidden="true" className={cn(shown, '-ml-2 items-center gap-2 px-2 py-1')}>
      <span className="size-5 animate-pulse rounded-full bg-surface-sunken" />
      <span className="h-4 w-10 animate-pulse rounded bg-surface-sunken" />
    </span>
  );
}

function renderState(
  state: Exclude<ViewerState, { readonly kind: 'anonymous' }>,
  compact: boolean
): React.ReactNode {
  if (state.kind === 'pending') {
    return (
      <>
        {renderKnownViewer(compact)}
        {renderSkeleton(compact, true)}
      </>
    );
  }
  if (state.kind === 'loading') return renderSkeleton(compact, false);

  const { avatarData } = state.viewer;
  const avatarStyle = avatarData === null ? undefined : { backgroundImage: `url("${avatarData}")` };
  const initial = avatarData === null ? initialOf(state.viewer) : null;

  if (compact) {
    return (
      <a
        href="/account"
        rel="nofollow"
        aria-label="حسابي"
        className={cn(AVATAR, 'size-full text-xs focus-ring')}
        style={avatarStyle}
      >
        {initial}
      </a>
    );
  }

  return (
    <a href="/account" rel="nofollow" className={NAV_ITEM}>
      <span aria-hidden="true" className={cn(AVATAR, 'size-5 text-[10px]')} style={avatarStyle}>
        {initial}
      </span>
      حسابي
    </a>
  );
}
