import { describe, expect, it } from 'bun:test';

import { renderReport } from './render';

describe('renderReport', () => {
  it('renders a section per resolved page with escaped values and pass/fail classes', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: 'poets/[slug]',
          path: '/poets/al-mutanabbi',
          inspectorResults: [
            {
              title: 'Page metadata',
              fields: [
                { label: 'title', value: 'a <b> & "c"', ok: true },
                { label: 'og:image', value: 'https://qafiyah.com/x.png', ok: true },
              ],
            },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).toContain('poets/[slug]');
    expect(html).toContain('/poets/al-mutanabbi');
    expect(html).toContain('Page metadata');
    expect(html).toContain('a &lt;b&gt; &amp; &quot;c&quot;');
    expect(html).toContain('field-ok');
    expect(html).toContain('<img class="thumb" src="https://qafiyah.com/x.png"');
  });

  it('resolves a relative og:image against the web base url', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: '/',
          path: '/',
          inspectorResults: [
            {
              title: 'Page metadata',
              fields: [{ label: 'og:image', value: '/open-graph.png', ok: true }],
            },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).toContain('src="http://localhost:4321/open-graph.png"');
  });

  it('marks a failing field with field-fail', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: '/',
          path: '/',
          inspectorResults: [
            {
              title: 'Page metadata',
              fields: [{ label: 'title', value: '(missing)', ok: false }],
            },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).toContain('field-fail');
  });

  it('renders a section with more than one registered inspector', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: '/',
          path: '/',
          inspectorResults: [
            { title: 'Page metadata', fields: [{ label: 'title', value: 't', ok: true }] },
            { title: 'Future report', fields: [{ label: 'x', value: 'y', ok: true }] },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).toContain('Page metadata');
    expect(html).toContain('Future report');
  });

  it('renders a warning block for every unresolved shape', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [],
      unresolvedShapes: ['poems/[slug]'],
    });
    expect(html).toContain('poems/[slug]');
    expect(html).toContain('no live example found');
  });

  it('collapses a valid json-ld field behind a details/summary disclosure', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: '/',
          path: '/',
          inspectorResults: [
            {
              title: 'Page metadata',
              fields: [{ label: 'json-ld[0]', value: '{\n  "@type": "Person"\n}', ok: true }],
            },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).toContain('<details class="field-value">');
    expect(html).toContain('<summary>');
    expect(html).toContain('&quot;@type&quot;');
  });

  it('does not collapse a failing json-ld field, so the error is immediately visible', () => {
    const html = renderReport({
      webBaseUrl: 'http://localhost:4321',
      sections: [
        {
          shape: '/',
          path: '/',
          inspectorResults: [
            {
              title: 'Page metadata',
              fields: [{ label: 'json-ld[0]', value: '{bad}', ok: false }],
            },
          ],
        },
      ],
      unresolvedShapes: [],
    });
    expect(html).not.toContain('<details');
    expect(html).toContain('field-fail');
  });
});
