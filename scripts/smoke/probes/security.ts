import { err, ok } from 'neverthrow';

import { SEARCH, WEB } from '../target';

import type { Probe } from '../types';

const CRLF_PAYLOAD = 'x\r\nSet-Cookie: smoke_crlf=pwned';
const XSS_TAG = '<script>smoke_xss()</script>';
const XSS_ATTR = '" onmouseover="smoke_xss()';

const isHtml = (res: Response): boolean => (res.headers.get('content-type') ?? '').includes('html');

export const securityProbes: readonly Probe[] = [
  {
    url: `${SEARCH}?q=${encodeURIComponent(CRLF_PAYLOAD)}`,
    expect: 'healthy',
    note: 'CRLF in query must not split response headers',
    check: (_body, res) =>
      (res.headers.get('set-cookie') ?? '').includes('smoke_crlf')
        ? err('CRLF injection leaked a Set-Cookie header')
        : ok(undefined),
  },
  {
    url: `${WEB}/poets?q=${encodeURIComponent(XSS_TAG)}`,
    expect: 'healthy',
    note: 'SSR must escape or strip a <script> payload',
    check: (body, res) =>
      isHtml(res) && body.includes(XSS_TAG)
        ? err('SSR reflected an unescaped <script> from the query')
        : ok(undefined),
  },
  {
    url: `${WEB}/poets?q=${encodeURIComponent(XSS_ATTR)}`,
    expect: 'healthy',
    note: 'SSR must escape an attribute-breakout payload',
    check: (body, res) =>
      isHtml(res) && body.includes('onmouseover="smoke_xss()')
        ? err('SSR reflected an unescaped attribute-breakout payload')
        : ok(undefined),
  },
];
