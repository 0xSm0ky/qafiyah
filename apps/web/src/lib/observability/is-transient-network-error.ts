const NETWORK_ERROR_MESSAGES: readonly string[] = [
  'load failed',
  'failed to fetch',
  'networkerror when attempting to fetch resource',
  'the network connection was lost',
  'cancelled',
  'unable to connect',
];

const NETWORK_ERROR_CODES: ReadonlySet<string> = new Set([
  'ConnectionRefused',
  'ConnectionClosed',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
]);

export function isTransientNetworkError(cause: unknown): boolean {
  if (
    cause instanceof DOMException &&
    (cause.name === 'AbortError' || cause.name === 'TimeoutError')
  ) {
    return true;
  }
  if (!(cause instanceof Error)) {
    return false;
  }
  if ('code' in cause && typeof cause.code === 'string' && NETWORK_ERROR_CODES.has(cause.code)) {
    return true;
  }
  if (typeof cause.message !== 'string') {
    return false;
  }
  const message = cause.message.toLowerCase();
  return NETWORK_ERROR_MESSAGES.some((needle) => message.includes(needle));
}
