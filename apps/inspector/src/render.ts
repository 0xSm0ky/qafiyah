import type { FieldResult } from './inspector';

type InspectorSectionResult = {
  readonly title: string;
  readonly fields: readonly FieldResult[];
};

type ReportSection = {
  readonly shape: string;
  readonly path: string;
  readonly inspectorResults: readonly InspectorSectionResult[];
};

export type ReportInput = {
  readonly webBaseUrl: string;
  readonly sections: readonly ReportSection[];
  readonly unresolvedShapes: readonly string[];
};

const IMAGE_LABELS = new Set(['og:image', 'twitter:image']);
const JSON_LD_LABEL_RE = /^json-ld(\[\d+\])?$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function resolveImageSrc(webBaseUrl: string, value: string): string {
  return value.startsWith('http') ? value : `${webBaseUrl}${value}`;
}

function renderField(field: FieldResult, webBaseUrl: string): string {
  const badge = field.ok ? 'field-ok' : 'field-fail';
  const showThumb = IMAGE_LABELS.has(field.label) && field.value !== '(missing)';
  const thumb = showThumb
    ? `<img class="thumb" src="${escapeHtml(resolveImageSrc(webBaseUrl, field.value))}" alt="${escapeHtml(field.label)}" />`
    : '';
  const isCollapsibleJsonLd = field.ok && JSON_LD_LABEL_RE.test(field.label);
  const valueHtml = isCollapsibleJsonLd
    ? `<details class="field-value"><summary>valid, click to expand</summary>${escapeHtml(field.value)}</details>`
    : `<span class="field-value">${escapeHtml(field.value)}</span>`;
  return `<div class="field ${badge}"><span class="field-label">${escapeHtml(field.label)}</span>${valueHtml}${thumb}</div>`;
}

function renderInspectorResult(result: InspectorSectionResult, webBaseUrl: string): string {
  const fieldsHtml = result.fields.map((field) => renderField(field, webBaseUrl)).join('\n');
  return `<div class="inspector"><h3>${escapeHtml(result.title)}</h3>${fieldsHtml}</div>`;
}

function renderSection(section: ReportSection, webBaseUrl: string): string {
  const resultsHtml = section.inspectorResults
    .map((result) => renderInspectorResult(result, webBaseUrl))
    .join('\n');
  return `<section class="page"><h2>${escapeHtml(section.shape)} <span class="path">${escapeHtml(section.path)}</span></h2>${resultsHtml}</section>`;
}

function renderUnresolved(shape: string): string {
  return `<section class="page page-unresolved"><h2>${escapeHtml(shape)}</h2><p>no live example found</p></section>`;
}

export function renderReport(input: ReportInput): string {
  const sectionsHtml = input.sections
    .map((section) => renderSection(section, input.webBaseUrl))
    .join('\n');
  const unresolvedHtml = input.unresolvedShapes.map((shape) => renderUnresolved(shape)).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Inspector</title>
<style>
body { font-family: system-ui, sans-serif; margin: 2rem; background: #0e0c0c; color: #fbfaf9; }
h2 { display: flex; gap: 0.75rem; align-items: baseline; }
.path { font-size: 0.8rem; opacity: 0.6; font-weight: normal; }
section.page { border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
.inspector h3 { font-size: 0.9rem; opacity: 0.8; margin: 0.75rem 0 0.25rem; }
.field { display: grid; grid-template-columns: 160px 1fr; gap: 0.75rem; padding: 0.25rem 0; align-items: start; }
.field-value { word-break: break-word; white-space: pre-wrap; }
details.field-value summary { cursor: pointer; opacity: 0.7; }
.field-ok .field-label::before { content: "\\2713 "; color: #4ade80; }
.field-fail .field-label::before { content: "\\2717 "; color: #f87171; }
.thumb { max-width: 240px; max-height: 140px; border-radius: 4px; grid-column: 2; }
.page-unresolved { border-color: #f87171; }
</style>
</head>
<body>
<h1>Inspector: page metadata</h1>
${unresolvedHtml}
${sectionsHtml}
</body>
</html>`;
}
