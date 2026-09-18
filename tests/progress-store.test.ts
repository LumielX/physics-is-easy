import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Regression tests for the progress store's selectors.
 *
 * The bug these exist to prevent: a selector written as
 * `useProgress((s) => s.chapters[id]?.stages ?? [])` returns a brand-new array
 * on every read. React compares snapshots by identity, so it concludes the
 * store changed on every render and warns "The result of getSnapshot should be
 * cached to avoid an infinite loop". Selectors must return a stable reference
 * when nothing has changed.
 */

// zustand's persist middleware reaches for localStorage when the store is
// created, so give it one before importing the module.
function installLocalStorage() {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() {
        return data.size;
      },
    },
  });
}

let store: typeof import('@/lib/progress/store');

beforeAll(async () => {
  installLocalStorage();
  store = await import('@/lib/progress/store');
});

describe('selectStages', () => {
  it('returns the identical reference across reads when a chapter has no progress', () => {
    const state = store.useProgress.getState();
    const select = store.selectStages('m4-02');

    const first = select(state);
    const second = select(state);

    expect(first).toEqual([]);
    // Identity, not just equality — this is what React compares.
    expect(first).toBe(second);
  });

  it('returns the identical reference for different chapters with no progress', () => {
    const state = store.useProgress.getState();
    expect(store.selectStages('m4-02')(state)).toBe(store.selectStages('m6-19')(state));
  });

  it('returns the stored array once a stage is recorded', () => {
    store.useProgress.getState().markStage('m5-09', 'learn');

    const state = store.useProgress.getState();
    const stages = store.selectStages('m5-09')(state);

    expect(stages).toContain('learn');
    // Reading twice must still give the same reference.
    expect(store.selectStages('m5-09')(state)).toBe(stages);

    store.useProgress.getState().resetChapter('m5-09');
  });

  it('keeps a stable reference after an unrelated chapter changes', () => {
    const before = store.selectStages('m4-01')(store.useProgress.getState());
    store.useProgress.getState().markStage('m6-13', 'quiz');
    const after = store.selectStages('m4-01')(store.useProgress.getState());

    expect(after).toBe(before);
    store.useProgress.getState().resetChapter('m6-13');
  });
});

describe('progress bookkeeping', () => {
  it('records the best score across attempts', () => {
    const { recordQuiz } = store.useProgress.getState();
    recordQuiz('m4-03', 40, ['แรงเสียดทาน']);
    recordQuiz('m4-03', 85, []);
    recordQuiz('m4-03', 60, ['พื้นเอียง']);

    const p = store.useProgress.getState().chapters['m4-03'];
    expect(p.attempts).toBe(3);
    expect(p.bestScore).toBe(85);
    expect(p.lastScore).toBe(60);
    // Passing the quiz marks that stage done.
    expect(p.stages).toContain('quiz');

    store.useProgress.getState().resetChapter('m4-03');
  });

  it('does not duplicate a stage marked twice', () => {
    const { markStage } = store.useProgress.getState();
    markStage('m4-04', 'learn');
    markStage('m4-04', 'learn');
    expect(store.useProgress.getState().chapters['m4-04'].stages).toEqual(['learn']);
    store.useProgress.getState().resetChapter('m4-04');
  });

  it('keeps the recent list newest-first without duplicates', () => {
    const { visit } = store.useProgress.getState();
    visit('m4-05');
    visit('m4-06');
    visit('m4-05');

    const recent = store.useProgress.getState().recent;
    expect(recent[0]).toBe('m4-05');
    expect(recent.filter((id) => id === 'm4-05')).toHaveLength(1);

    store.useProgress.getState().resetAll();
  });

  it('computes course completion from stages done', () => {
    const { markStage } = store.useProgress.getState();
    // Three of six stages in one chapter, out of a 19-chapter course.
    for (const stage of ['learn', 'explore', 'experiment'] as const) {
      markStage('m4-07', stage);
    }
    const completion = store.courseCompletion(store.useProgress.getState().chapters, 19);
    expect(completion).toBe(Math.round((0.5 / 19) * 100));
    store.useProgress.getState().resetAll();
  });
});
