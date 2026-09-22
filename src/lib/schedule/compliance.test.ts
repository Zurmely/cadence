import { describe, expect, it } from 'vitest';
import { createComplianceStore, expectedKeysForProfile, todayIso, type ComplianceKey } from './compliance';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const EXPECTED: ComplianceKey[] = [
  { medicationId: 'med-1', slot: 'morning' },
  { medicationId: 'med-1', slot: 'evening' },
];

describe('compliance store', () => {
  it('starts unchecked and toggles a single date+medication+slot entry', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(false);

    store.toggle('2024-05-01', 'med-1', 'morning');
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(true);
    expect(store.isChecked('2024-05-01', 'med-1', 'evening')).toBe(false);

    store.toggle('2024-05-01', 'med-1', 'morning');
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(false);
    store.destroy();
  });

  it('persists check-offs under the versioned key', () => {
    const storage = memoryStorage();
    const store = createComplianceStore({ storage });
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    expect(store.key).toBe('cadence.compliance.v1');
    const raw = JSON.parse(storage.getItem(store.key) ?? '{}');
    expect(raw['2024-05-01|med-1|morning']).toBe(true);
    store.destroy();
  });

  it('keys are isolated per date — a new day resets to unchecked', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(true);
    expect(store.isChecked('2024-05-02', 'med-1', 'morning')).toBe(false);
    store.destroy();
  });

  it('summarizes checked-vs-total for a day', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    expect(store.getDaySummary('2024-05-01', EXPECTED)).toEqual({ checked: 1, total: 2 });
    store.setChecked('2024-05-01', 'med-1', 'evening', true);
    expect(store.getDaySummary('2024-05-01', EXPECTED)).toEqual({ checked: 2, total: 2 });
    store.destroy();
  });

  it('notifies subscribers on every change', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.toggle('2024-05-01', 'med-1', 'morning');
    store.toggle('2024-05-01', 'med-1', 'morning');
    expect(calls).toBe(2);
    unsubscribe();
    store.destroy();
  });

  it('computes a streak of consecutive fully-complete days', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    const days = ['2024-05-01', '2024-05-02', '2024-05-03'];
    for (const day of days) {
      for (const item of EXPECTED) store.setChecked(day, item.medicationId, item.slot, true);
    }
    expect(store.getStreak(EXPECTED, '2024-05-03')).toBe(3);
    store.destroy();
  });

  it('does not break the streak just because today is still in progress', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    store.setChecked('2024-05-01', 'med-1', 'evening', true);
    store.setChecked('2024-05-02', 'med-1', 'morning', true);
    // today (05-02) only has the morning dose checked so far
    expect(store.getStreak(EXPECTED, '2024-05-02')).toBe(1);
    store.destroy();
  });

  it('breaks the streak at the first fully incomplete prior day', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    for (const item of EXPECTED) store.setChecked('2024-05-01', item.medicationId, item.slot, true);
    // 2024-05-02 has nothing checked
    for (const item of EXPECTED) store.setChecked('2024-05-03', item.medicationId, item.slot, true);
    expect(store.getStreak(EXPECTED, '2024-05-03')).toBe(1);
    store.destroy();
  });

  it('returns 0 for an empty medication schedule', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    expect(store.getStreak([], '2024-05-03')).toBe(0);
    store.destroy();
  });

  it('prunes entries older than the retention window', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    store.setChecked('2023-01-01', 'med-1', 'morning', true);
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    store.prune('2024-05-01', 30);
    expect(store.isChecked('2023-01-01', 'med-1', 'morning')).toBe(false);
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(true);
    store.destroy();
  });

  it('clears all check-offs', () => {
    const store = createComplianceStore({ storage: memoryStorage() });
    store.setChecked('2024-05-01', 'med-1', 'morning', true);
    store.clear();
    expect(store.isChecked('2024-05-01', 'med-1', 'morning')).toBe(false);
    store.destroy();
  });
});

describe('expectedKeysForProfile', () => {
  it('flattens medications into medicationId/slot pairs for scheduled slots only', () => {
    const keys = expectedKeysForProfile([
      {
        id: 'med-1',
        slots: { morning: true, afternoon: false, evening: true, bedtime: false },
      },
      {
        id: 'med-2',
        slots: { morning: false, afternoon: false, evening: false, bedtime: true },
      },
    ]);
    expect(keys).toEqual([
      { medicationId: 'med-1', slot: 'morning' },
      { medicationId: 'med-1', slot: 'evening' },
      { medicationId: 'med-2', slot: 'bedtime' },
    ]);
  });
});

describe('todayIso', () => {
  it('formats a local date without shifting by timezone', () => {
    expect(todayIso(new Date(2024, 4, 1))).toBe('2024-05-01');
    expect(todayIso(new Date(2024, 0, 9))).toBe('2024-01-09');
  });
});
