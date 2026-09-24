import * as v from 'valibot';

export const SETTINGS_STORAGE_KEY = 'qafiyah:settings';

export const SETTINGS_VERSION = 1;

export const FONT_SCALE_MIN = 0.7;
export const FONT_SCALE_MAX = 1.5;
export const FONT_SCALE_STEP = 0.1;

export type Theme = 'system' | 'light' | 'dark';

export type Settings = {
  readonly theme: Theme;
  readonly poemFontScale: number;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  poemFontScale: 1,
};

const themeSchema = v.picklist(['system', 'light', 'dark']);
const legacyThemeSchema = v.picklist(['light', 'dark']);
const fontScaleSchema = v.pipe(v.number(), v.minValue(FONT_SCALE_MIN), v.maxValue(FONT_SCALE_MAX));

type StoredRecord = Record<string, unknown>;

function isRecord(value: unknown): value is StoredRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecord(raw: string | null | undefined): StoredRecord | null {
  if (raw === null || raw === undefined || raw === '') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function pick<T>(schema: v.GenericSchema<unknown, T>, value: unknown, fallback: T): T {
  const result = v.safeParse(schema, value);
  return result.success ? result.output : fallback;
}

export function parseSettings(raw: string | null, legacyTheme: string | null): Settings {
  const stored = toRecord(raw);

  if (stored === null) {
    return {
      ...DEFAULT_SETTINGS,
      theme: pick(legacyThemeSchema, legacyTheme, DEFAULT_SETTINGS.theme),
    };
  }

  return {
    theme: pick(themeSchema, stored['theme'], DEFAULT_SETTINGS.theme),
    poemFontScale: pick(fontScaleSchema, stored['poemFontScale'], DEFAULT_SETTINGS.poemFontScale),
  };
}

export function serializeSettings(raw: string | null, patch: Partial<Settings>): string {
  const stored = toRecord(raw) ?? {};
  const storedVersion = pick(v.pipe(v.number(), v.integer()), stored['v'], 0);

  return JSON.stringify({
    ...stored,
    ...patch,
    v: Math.max(storedVersion, SETTINGS_VERSION),
  });
}

export function clampFontScale(scale: number): number {
  const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
  return Math.round(clamped * 10) / 10;
}
