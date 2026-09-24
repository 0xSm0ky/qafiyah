const ENCODER = new TextEncoder();

async function sign(secret: string, nonce: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, ENCODER.encode(nonce));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function mintState(secret: string, nonce: string): Promise<string> {
  return `${nonce}.${await sign(secret, nonce)}`;
}

export async function verifyState(secret: string, value: string): Promise<boolean> {
  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;
  const nonce = value.slice(0, separator);
  const presented = value.slice(separator + 1);
  const expected = await sign(secret, nonce);
  if (presented.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= (presented.codePointAt(i) ?? 0) ^ (expected.codePointAt(i) ?? 0);
  }
  return mismatch === 0;
}
