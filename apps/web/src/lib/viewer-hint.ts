import { SESSION_MAX_AGE_SECONDS, VIEWER_HINT_COOKIE } from '@/lib/constants/config';

export function viewerHintCookie(signedIn: boolean): string {
  const value = signedIn ? '1' : '';
  const maxAge = signedIn ? SESSION_MAX_AGE_SECONDS : 0;
  return `${VIEWER_HINT_COOKIE}=${value}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
