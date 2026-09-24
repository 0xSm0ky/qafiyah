import { describe, expect, it } from 'vitest';

import { buttonVariants } from './button';

describe('buttonVariants', () => {
  it('renders the filled default variant with accent background and layer-opacity hover', () => {
    expect(buttonVariants({ variant: 'default' })).toContain('bg-accent');
    expect(buttonVariants({ variant: 'default' })).toContain('text-surface');
    expect(buttonVariants({ variant: 'default' })).toContain('hover:opacity-90');
  });

  it('renders the filled destructive variant with danger background and layer-opacity hover', () => {
    expect(buttonVariants({ variant: 'destructive' })).toContain('bg-danger');
    expect(buttonVariants({ variant: 'destructive' })).toContain('text-surface');
    expect(buttonVariants({ variant: 'destructive' })).toContain('hover:opacity-90');
  });

  it('renders the quiet outline variant hovering to surface-hover, not accent', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('border-border');
    expect(classes).toContain('bg-surface');
    expect(classes).toContain('hover:bg-surface-hover');
    expect(classes).not.toContain('hover:bg-accent');
  });

  it('renders the quiet secondary variant hovering to surface-hover, not opacity', () => {
    const classes = buttonVariants({ variant: 'secondary' });
    expect(classes).toContain('bg-surface-sunken');
    expect(classes).toContain('text-text');
    expect(classes).toContain('hover:bg-surface-hover');
  });

  it('renders the quiet ghost variant hovering to surface-hover, not accent', () => {
    const classes = buttonVariants({ variant: 'ghost' });
    expect(classes).toContain('hover:bg-surface-hover');
    expect(classes).not.toContain('hover:bg-accent');
  });

  it('renders the link variant in the highlight color, not the neutral accent', () => {
    const classes = buttonVariants({ variant: 'link' });
    expect(classes).toContain('text-highlight');
    expect(classes).not.toContain('text-accent');
  });

  it('never renders a shadow, since elevation is none', () => {
    for (const variant of [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const) {
      const classes = buttonVariants({ variant });
      expect(classes).not.toMatch(/(?:^|\s)shadow(?:-\w+)?(?:\s|$)/);
    }
  });

  it('uses the canonical text-token focus ring', () => {
    expect(buttonVariants({ variant: 'default' })).toContain('focus-visible:ring-text');
  });
});
