import { describe, expect, it } from 'vitest';

import { mergeAdjacentMarks } from './highlighted-text';

describe('mergeAdjacentMarks', () => {
  it('merges marks separated only by a space into one mark', () => {
    expect(mergeAdjacentMarks('<mark>يا</mark> <mark>رب</mark>')).toBe('<mark>يا رب</mark>');
  });

  it('merges a run of three adjacent marks into one', () => {
    expect(mergeAdjacentMarks('<mark>يا</mark> <mark>رب</mark> <mark>أنت</mark> خلقتني')).toBe(
      '<mark>يا رب أنت</mark> خلقتني'
    );
  });

  it('keeps marks separated by unmarked text as distinct boxes', () => {
    const text = '<mark>يا</mark> رب <mark>أنت</mark>';
    expect(mergeAdjacentMarks(text)).toBe(text);
  });

  it('does not merge across a verse separator (no whitespace between marks)', () => {
    const text = '<mark>ربه</mark>*<mark>فيه</mark>';
    expect(mergeAdjacentMarks(text)).toBe(text);
  });

  it('leaves text without adjacent marks unchanged', () => {
    const text = '<mark>ألم</mark> تكاثر فأره';
    expect(mergeAdjacentMarks(text)).toBe(text);
  });

  it('collapses multi-character whitespace runs between marks', () => {
    expect(mergeAdjacentMarks('<mark>يا</mark>\n  <mark>رب</mark>')).toBe('<mark>يا\n  رب</mark>');
  });
});
