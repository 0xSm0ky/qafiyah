import { describe, expect, it } from 'vitest';

import { fakeContext } from '@/test/context';

import { GET } from './llms.txt';

describe('GET /llms.txt', () => {
  it('serves text with no leftover placeholder', async () => {
    const response = await GET(fakeContext());
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    const text = await response.text();
    expect(text).not.toContain('{SITE}');
    expect(text).not.toContain('{API}');
    expect(text).toContain('## Browse');
  });
});
