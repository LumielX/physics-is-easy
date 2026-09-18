/**
 * Viewer preferences (theme, motion, reading density).
 *
 * Deliberately not in a state library: these must be applied to <html> before
 * first paint to avoid a flash of the wrong theme, so the source of truth is
 * the DOM attribute itself plus localStorage. React just mirrors it.
 */

export type ThemeSetting = 'light' | 'dark' | 'system';
export type MotionSetting = 'system' | 'reduced';
export type DensitySetting = 'normal' | 'comfortable' | 'large';

export interface Preferences {
  theme: ThemeSetting;
  motion: MotionSetting;
  density: DensitySetting;
}

export const STORAGE_KEYS = {
  theme: 'pie:theme',
  motion: 'pie:motion',
  density: 'pie:density',
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  motion: 'system',
  density: 'normal',
};

/** Runs before hydration (inlined in <head>) — keep it dependency-free and tiny. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem('${STORAGE_KEYS.theme}')||'system';
var resolved=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;
d.setAttribute('data-theme',resolved);
var m=localStorage.getItem('${STORAGE_KEYS.motion}');
if(m==='reduced')d.setAttribute('data-motion','reduced');
var s=localStorage.getItem('${STORAGE_KEYS.density}');
if(s&&s!=='normal')d.setAttribute('data-density',s);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export function resolveTheme(setting: ThemeSetting): 'light' | 'dark' {
  if (setting !== 'system') return setting;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyPreferences(prefs: Partial<Preferences>): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;

  if (prefs.theme) {
    el.setAttribute('data-theme', resolveTheme(prefs.theme));
    safeSet(STORAGE_KEYS.theme, prefs.theme);
  }
  if (prefs.motion) {
    if (prefs.motion === 'reduced') el.setAttribute('data-motion', 'reduced');
    else el.removeAttribute('data-motion');
    safeSet(STORAGE_KEYS.motion, prefs.motion);
  }
  if (prefs.density) {
    if (prefs.density === 'normal') el.removeAttribute('data-density');
    else el.setAttribute('data-density', prefs.density);
    safeSet(STORAGE_KEYS.density, prefs.density);
  }
}

export function readPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  return {
    theme: (safeGet(STORAGE_KEYS.theme) as ThemeSetting) || DEFAULT_PREFERENCES.theme,
    motion: (safeGet(STORAGE_KEYS.motion) as MotionSetting) || DEFAULT_PREFERENCES.motion,
    density: (safeGet(STORAGE_KEYS.density) as DensitySetting) || DEFAULT_PREFERENCES.density,
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled — preference stays for this page only */
  }
}
