'use client';

import { useEffect, useState } from 'react';

export interface SceneColors {
  accent: string;
  text: string;
  muted: string;
  grid: string;
  surface: string;
  series: [string, string, string, string];
  ok: string;
  bad: string;
}

const FALLBACK: SceneColors = {
  accent: '#4f5bd5',
  text: '#101420',
  muted: '#58607a',
  grid: '#dde3ef',
  surface: '#ffffff',
  series: ['#f97316', '#0ea5e9', '#a855f7', '#10b981'],
  ok: '#0f9d58',
  bad: '#d92d20',
};

/**
 * Reads the active theme's colours so 3-D scenes match the rest of the page,
 * and re-reads them when the theme is toggled.
 */
export function useSceneColors(): SceneColors {
  const [colors, setColors] = useState<SceneColors>(FALLBACK);

  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const v = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
      setColors({
        accent: v('--accent', FALLBACK.accent),
        text: v('--text', FALLBACK.text),
        muted: v('--text-muted', FALLBACK.muted),
        grid: v('--border', FALLBACK.grid),
        surface: v('--surface', FALLBACK.surface),
        series: [
          v('--series-1', FALLBACK.series[0]),
          v('--series-2', FALLBACK.series[1]),
          v('--series-3', FALLBACK.series[2]),
          v('--series-4', FALLBACK.series[3]),
        ],
        ok: v('--ok', FALLBACK.ok),
        bad: v('--bad', FALLBACK.bad),
      });
    };

    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  return colors;
}
