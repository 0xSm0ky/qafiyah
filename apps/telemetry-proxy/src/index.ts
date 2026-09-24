const SENTRY_INGEST_HOST = 'o4511571113148416.ingest.us.sentry.io';
const SENTRY_ALLOWED_PROJECT_IDS = new Set(['4511594177560576']);
const SENTRY_ENVELOPE_PATH = /^\/api\/(\d+)\/envelope\/$/;

const ALLOWED_ORIGINS = new Set(['https://qafiyah.com', 'https://www.qafiyah.com']);

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  const allowed = origin !== null && ALLOWED_ORIGINS.has(origin);
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    allowed
      ? (request.headers.get('Access-Control-Request-Headers') ?? 'content-type')
      : 'content-type'
  );
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Access-Control-Expose-Headers', 'X-Sentry-Rate-Limits, Retry-After');
  return headers;
}

function forwardHeaders(source: Headers): Headers {
  const headers = new Headers();
  const contentType = source.get('Content-Type');
  if (contentType !== null) headers.set('Content-Type', contentType);
  const contentEncoding = source.get('Content-Encoding');
  if (contentEncoding !== null) headers.set('Content-Encoding', contentEncoding);
  const origin = source.get('Origin');
  if (origin !== null) headers.set('Origin', origin);
  const referer = source.get('Referer');
  if (referer !== null) headers.set('Referer', referer);
  return headers;
}

function withCors(request: Request, upstream: Response): Response {
  const headers = new Headers(upstream.headers);
  corsHeaders(request).forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(upstream.body, { status: upstream.status, headers });
}

async function proxySentry(request: Request, url: URL, projectId: string): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!SENTRY_ALLOWED_PROJECT_IDS.has(projectId)) {
    return new Response('Forbidden', { status: 403 });
  }
  const upstream = await fetch(
    `https://${SENTRY_INGEST_HOST}/api/${projectId}/envelope/${url.search}`,
    {
      method: 'POST',
      headers: forwardHeaders(request.headers),
      body: await request.arrayBuffer(),
    }
  );
  return withCors(request, upstream);
}

export default {
  fetch(request: Request): Response | Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const sentryMatch = url.pathname.match(SENTRY_ENVELOPE_PATH);
    const projectId = sentryMatch?.[1];
    if (projectId !== undefined) return proxySentry(request, url, projectId);

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler;
