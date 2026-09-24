import { SEARCH_TEXTS } from '@/lib/constants/copy';
import { MAX_QUERY_LENGTH } from '@qafiyah/config';

export function validateText(input: string): string | null {
  if (input.length > MAX_QUERY_LENGTH) {
    return SEARCH_TEXTS.maxLengthErrorTemplate.replace('{n}', String(MAX_QUERY_LENGTH));
  }
  return null;
}

export function splitCsvIds(value: string | readonly string[]): readonly string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return value.filter((entry) => entry.trim() !== '');
}

export function createCsvFilterSetter(setter: (value: string | null) => unknown) {
  return (value: string | string[]) => {
    const joined = Array.isArray(value)
      ? value
          .map((entry) => entry.trim())
          .filter(Boolean)
          .join(',')
      : value.trim();
    void setter(joined || null);
  };
}
