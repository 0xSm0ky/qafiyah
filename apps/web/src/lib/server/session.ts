import { accountFetch } from '@/lib/server/account-client';

export const SESSION_COOKIE = 'qaf_session';

export type Profile = {
  readonly id: number;
  readonly email: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
};

type ApiProfile = {
  readonly id: number;
  readonly email: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
};

export function sessionCookieAttributes(maxAgeSeconds: number): string {
  return `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function readSessionId(cookieHeader: string | null): string | undefined {
  if (cookieHeader === null || cookieHeader === '') return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=') || undefined;
  }
  return undefined;
}

export async function resolveViewer(cookieHeader: string | null): Promise<Profile | undefined> {
  const id = readSessionId(cookieHeader);
  if (id === undefined) return undefined;
  const result = await accountFetch<ApiProfile>(`/sessions/${encodeURIComponent(id)}`);
  if (!result.ok || result.value === undefined) return undefined;
  const profile = result.value;
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}
