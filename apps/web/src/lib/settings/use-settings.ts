'use client';

import { useSyncExternalStore } from 'react';

import { type Settings } from './settings-schema';
import { getServerSettings, getSettings, subscribe } from './settings-store';

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getServerSettings);
}
