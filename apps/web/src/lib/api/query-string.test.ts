import { describe, expect, it } from 'vitest';

import { serializeQuery } from './query-string';

describe('serializeQuery', () => {
  it('repeats the key for each array value', () => {
    expect(serializeQuery({ era: ['jahili', 'abbasi'] })).toBe('era=jahili&era=abbasi');
  });

  it('writes a one element array as a single bare pair', () => {
    expect(serializeQuery({ era: ['jahili'] })).toBe('era=jahili');
  });

  it('omits empty arrays entirely', () => {
    expect(serializeQuery({ q: 'حب', era: [], meter: [] })).toBe('q=%D8%AD%D8%A8');
  });

  it('omits undefined and null but keeps an empty string', () => {
    expect(serializeQuery({ a: undefined, b: null, c: '' })).toBe('c=');
  });

  it('stringifies numbers and booleans', () => {
    expect(serializeQuery({ page: 3, exact: true })).toBe('page=3&exact=true');
  });

  it('drops null and undefined entries inside an array', () => {
    expect(serializeQuery({ era: ['jahili', null, undefined, 'abbasi'] })).toBe(
      'era=jahili&era=abbasi'
    );
  });
});
