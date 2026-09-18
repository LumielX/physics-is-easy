'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  applyPreferences,
  readPreferences,
  resolveTheme,
  STORAGE_KEYS,
  type DensitySetting,
  type MotionSetting,
  type Preferences,
  type ThemeSetting,
} from '@/lib/settings/preferences';

interface ThemeContextValue extends Preferences {
  /** The theme actually in effect once `system` is resolved. */
  resolved: 'light' | 'dark';
  /** True once localStorage has been read — guards SSR/hydration mismatches. */
  ready: boolean;
  setTheme: (t: ThemeSetting) => void;
  setMotion: (m: MotionSetting) => void;
  setDensity: (d: DensitySetting) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const [ready, setReady] = useState(false);

  // Mirror what the bootstrap script already applied to <html>.
  useEffect(() => {
    const stored = readPreferences();
    setPrefs(stored);
    setResolved(resolveTheme(stored.theme));
    setReady(true);
  }, []);

  // Follow the OS when the user is on "system".
  useEffect(() => {
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      setResolved(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [prefs.theme]);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !Object.values(STORAGE_KEYS).includes(e.key as never)) return;
      const stored = readPreferences();
      setPrefs(stored);
      setResolved(resolveTheme(stored.theme));
      applyPreferences(stored);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPreferences(patch);
      if (patch.theme) setResolved(resolveTheme(patch.theme));
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...prefs,
      resolved,
      ready,
      setTheme: (theme) => update({ theme }),
      setMotion: (motion) => update({ motion }),
      setDensity: (density) => update({ density }),
      toggleTheme: () => update({ theme: resolved === 'dark' ? 'light' : 'dark' }),
    }),
    [prefs, resolved, ready, update],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
