import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const FONT_SIZES = [
  'display',
  'title',
  'heading',
  'interface-heading',
  'subheading',
  'body',
  'caption',
  'micro',
  'xxs',
];

const TEXT_COLORS = [
  'text',
  'text-muted',
  'text-subtle',
  'surface',
  'surface-raised',
  'surface-sunken',
  'surface-hover',
  'accent',
  'highlight',
  'danger',
  'border',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZES }],
      'text-color': [{ text: TEXT_COLORS }],
    },
  },
});

export function cn(...inputs: readonly ClassValue[]) {
  return twMerge(clsx(inputs));
}
