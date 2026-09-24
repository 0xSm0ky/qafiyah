import { SITE_THEME_COLOR_DARK_HEX, SITE_THEME_COLOR_HEX } from '@/lib/constants/site-meta';

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type Settings,
  type Theme,
} from './settings-schema';
import {
  readStoredSettings,
  resolveIsDark,
  SETTINGS_CHANGE_EVENT,
  writeStoredSettings,
} from './settings-storage';

let cache: Settings | null = null;
let wired = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function wire(): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;

  window.addEventListener(SETTINGS_CHANGE_EVENT, (event) => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- updateSettings always dispatches a CustomEvent<Settings>
    const detail = (event as CustomEvent<Settings>).detail;
    cache = detail;
    notify();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== SETTINGS_STORAGE_KEY) return;
    cache = null;
    notify();
  });
}

export function getSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  cache ??= readStoredSettings(window.localStorage);
  return cache;
}

export function getServerSettings(): Settings {
  return DEFAULT_SETTINGS;
}

export function subscribe(listener: () => void): () => void {
  wire();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateSettings(patch: Partial<Settings>): void {
  const next = { ...getSettings(), ...patch };
  cache = next;
  writeStoredSettings(window.localStorage, patch);
  if (patch.theme !== undefined) applyTheme(patch.theme);
  notify();
  window.dispatchEvent(new CustomEvent<Settings>(SETTINGS_CHANGE_EVENT, { detail: next }));
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const isDark = resolveIsDark(theme, (query) => window.matchMedia(query));
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? SITE_THEME_COLOR_DARK_HEX : SITE_THEME_COLOR_HEX);
}
