export const NEW_KEY_COOKIE = 'qaf_new_key';
const NEW_KEY_MAX_AGE_SECONDS = 120;

export function setNewKeyCookie(value: string): string {
  return `${NEW_KEY_COOKIE}=${encodeURIComponent(value)}; Path=/account; HttpOnly; Secure; SameSite=Lax; Max-Age=${NEW_KEY_MAX_AGE_SECONDS}`;
}

export function clearNewKeyCookie(): string {
  return `${NEW_KEY_COOKIE}=; Path=/account; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readNewKeyCookie(cookieHeader: string | null): string | undefined {
  if (cookieHeader === null || cookieHeader === '') return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === NEW_KEY_COOKIE) {
      const raw = rest.join('=');
      if (raw === '') return undefined;
      try {
        return decodeURIComponent(raw);
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
