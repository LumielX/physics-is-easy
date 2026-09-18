'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ParamSpec, Preset } from './types';

export interface SimParams {
  values: Record<string, number>;
  setValue: (key: string, value: number) => void;
  setValues: (patch: Record<string, number>) => void;
  reset: () => void;
  applyPreset: (id: string) => void;
  activePreset: string | null;
  /** Changes on every reset/preset — pass to <SimCanvas resetKey> to restart. */
  resetKey: number;
}

/**
 * Holds the adjustable inputs of a simulator.
 *
 * Values live in React state because they change only when a human moves a
 * slider (a few times a second at most). The physics state that changes 60
 * times a second lives in refs inside the simulator itself — see DECISIONS
 * D-007.
 */
export function useSimParams(specs: ParamSpec[], presets: Preset[] = []): SimParams {
  const defaults = useMemo(
    () => Object.fromEntries(specs.map((s) => [s.key, s.default])) as Record<string, number>,
    [specs],
  );

  const [values, setAll] = useState<Record<string, number>>(defaults);
  const [activePreset, setActivePreset] = useState<string | null>(presets[0]?.id ?? null);
  const [resetKey, setResetKey] = useState(0);
  const specMap = useRef(new Map(specs.map((s) => [s.key, s])));
  specMap.current = new Map(specs.map((s) => [s.key, s]));

  const clampToSpec = useCallback((key: string, value: number) => {
    const spec = specMap.current.get(key);
    if (!spec) return value;
    return Math.min(spec.max, Math.max(spec.min, value));
  }, []);

  const setValue = useCallback(
    (key: string, value: number) => {
      setAll((prev) => ({ ...prev, [key]: clampToSpec(key, value) }));
      setActivePreset(null);
    },
    [clampToSpec],
  );

  const setValues = useCallback(
    (patch: Record<string, number>) => {
      setAll((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(patch)) next[k] = clampToSpec(k, v);
        return next;
      });
    },
    [clampToSpec],
  );

  const reset = useCallback(() => {
    setAll(defaults);
    setActivePreset(presets[0]?.id ?? null);
    setResetKey((k) => k + 1);
  }, [defaults, presets]);

  const applyPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      setAll((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(preset.values)) next[k] = clampToSpec(k, v);
        return next;
      });
      setActivePreset(id);
      setResetKey((k) => k + 1);
    },
    [presets, clampToSpec],
  );

  return { values, setValue, setValues, reset, applyPreset, activePreset, resetKey };
}

/**
 * State that can safely be written from inside an animation frame.
 * Updates are dropped unless `ms` has passed, which keeps numeric readouts
 * legible (a value changing 60×/s is unreadable anyway) and stops the React
 * tree from re-rendering every frame.
 */
export function useThrottledState<T>(initial: T, ms = 100): [T, (value: T) => void] {
  const [state, setState] = useState(initial);
  const last = useRef(0);

  const set = useCallback(
    (value: T) => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - last.current < ms) return;
      last.current = now;
      setState(value);
    },
    [ms],
  );

  return [state, set];
}
