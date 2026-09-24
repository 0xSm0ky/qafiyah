import { describe, expect, it } from 'vitest';

import { TYPE } from './design-tokens';

describe('TYPE', () => {
  it('maps each named step to its Figma-scale utility class', () => {
    expect(TYPE.display).toBe('text-display');
    expect(TYPE.title).toBe('text-title');
    expect(TYPE.heading).toBe('text-heading');
    expect(TYPE.interfaceHeading).toBe('text-interface-heading');
    expect(TYPE.subheading).toBe('text-subheading');
    expect(TYPE.body).toBe('text-body');
    expect(TYPE.caption).toBe('text-caption');
    expect(TYPE.micro).toBe('text-micro');
  });

  it('does not export the removed bodyLg step', () => {
    expect('bodyLg' in TYPE).toBe(false);
  });
});
