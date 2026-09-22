import { useCallback, useEffect, useState } from 'react';
import type { ScheduleSlot } from '../profile/schema';
import {
  getComplianceStore,
  todayIso,
  type ComplianceKey,
  type ComplianceStore,
  type DaySummary,
} from './compliance';

/**
 * Reactive view of today's compliance for a given set of expected
 * medication/slot check-offs, plus the current streak of fully-complete
 * days. Re-renders on every check-off (store has no debounce).
 */
export function useCompliance(
  expected: ComplianceKey[],
  store: ComplianceStore = getComplianceStore(),
): {
  date: string;
  isChecked: (medicationId: string, slot: ScheduleSlot) => boolean;
  toggle: (medicationId: string, slot: ScheduleSlot) => void;
  summary: DaySummary;
  streak: number;
} {
  const [date, setDate] = useState(() => todayIso());
  const [, setTick] = useState(0);

  useEffect(() => {
    store.prune(date);
    const unsubscribe = store.subscribe(() => setTick((n) => n + 1));
    const interval = setInterval(() => setDate(todayIso()), 60_000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [store, date]);

  const isChecked = useCallback(
    (medicationId: string, slot: ScheduleSlot) => store.isChecked(date, medicationId, slot),
    [store, date],
  );

  const toggle = useCallback(
    (medicationId: string, slot: ScheduleSlot) => {
      store.toggle(date, medicationId, slot);
    },
    [store, date],
  );

  return {
    date,
    isChecked,
    toggle,
    summary: store.getDaySummary(date, expected),
    streak: store.getStreak(expected, date),
  };
}
