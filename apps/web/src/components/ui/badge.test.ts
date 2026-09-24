import { describe, expect, it } from 'vitest';

import { badgeVariants } from './badge';

describe('badgeVariants', () => {
  it('renders the filled default variant with accent background and layer-opacity hover', () => {
    const classes = badgeVariants({ variant: 'default' });
    expect(classes).toContain('bg-accent');
    expect(classes).toContain('text-surface');
    expect(classes).toContain('hover:opacity-90');
  });

  it('renders the filled destructive variant with danger background and layer-opacity hover', () => {
    const classes = badgeVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-danger');
    expect(classes).toContain('text-surface');
    expect(classes).toContain('hover:opacity-90');
  });

  it('renders the quiet secondary variant hovering to surface-hover', () => {
    const classes = badgeVariants({ variant: 'secondary' });
    expect(classes).toContain('bg-surface-sunken');
    expect(classes).toContain('text-text');
    expect(classes).toContain('hover:bg-surface-hover');
  });

  it('renders the outline variant in the canonical text token', () => {
    expect(badgeVariants({ variant: 'outline' })).toContain('text-text');
  });

  it('never renders a shadow, since elevation is none', () => {
    for (const variant of ['default', 'secondary', 'destructive', 'outline'] as const) {
      const classes = badgeVariants({ variant });
      expect(classes).not.toMatch(/(?:^|\s)shadow(?:-\w+)?(?:\s|$)/);
    }
  });

  it('is a small metadata label: outlined at radius sm, never filled', () => {
    const outline = badgeVariants({ variant: 'outline' });
    expect(outline).toContain('rounded-sm');
    expect(outline).not.toContain('rounded-md');
    expect(outline).not.toMatch(/\bbg-/);
  });

  it('uses the single documented focus effect: 1px ring, no offset', () => {
    const base = badgeVariants({ variant: 'outline' });
    expect(base).toContain('focus-visible:ring-1');
    expect(base).toContain('focus-visible:ring-text');
    expect(base).not.toContain('ring-2');
    expect(base).not.toContain('ring-offset');
  });
});
