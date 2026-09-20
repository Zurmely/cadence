import { SCHEDULE_SLOTS, type ScheduleSlot } from '../profile/schema';

/** Versioned localStorage key. Bump the suffix if the on-disk shape changes. */
export const COMPLIANCE_STORAGE_KEY = 'cadence.compliance.v1';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ComplianceKey = { medicationId: string; slot: ScheduleSlot };

export type DaySummary = { checked: number; total: number };

export type ComplianceStore = {
  key: string;
  isChecked: (date: string, medicationId: string, slot: ScheduleSlot) => boolean;
  setChecked: (date: string, medicationId: string, slot: ScheduleSlot, checked: boolean) => void;
  toggle: (date: string, medicationId: string, slot: ScheduleSlot) => boolean;
  getDaySummary: (date: string, expected: ComplianceKey[]) => DaySummary;
  getStreak: (expected: ComplianceKey[], todayIso: string, maxDays?: number) => number;
  prune: (todayIso: string, keepDays?: number) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
};

type ComplianceMap = Record<string, true>;

function makeEntryKey(date: string, medicationId: string, slot: ScheduleSlot): string {
  return `${date}|${medicationId}|${slot}`;
}

function dateFromEntryKey(entryKey: string): string {
  return entryKey.slice(0, entryKey.indexOf('|'));
}

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function resolveStorage(storage?: StorageLike): StorageLike {
  if (storage) return storage;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* private mode / SSR */
  }
  return memoryStorage();
}

function readAll(storage: StorageLike, key: string): ComplianceMap {
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ComplianceMap) : {};
  } catch {
    return {};
  }
}

/** Local date in `YYYY-MM-DD`, without timezone shifting. */
export function todayIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + delta);
  return todayIso(date);
}

/** Every medication/slot pair a profile expects a check-off for. */
export function expectedKeysForProfile(
  medications: { id: string; slots: Record<ScheduleSlot, boolean> }[],
): ComplianceKey[] {
  const keys: ComplianceKey[] = [];
  for (const med of medications) {
    for (const slot of SCHEDULE_SLOTS) {
      if (med.slots[slot]) keys.push({ medicationId: med.id, slot });
    }
  }
  return keys;
}

/**
 * Local-first daily medication compliance. Check-offs are keyed by date, so
 * a new calendar day always starts unchecked ("reset daily") while history
 * stays available for streak calculations.
 */
export function createComplianceStore(
  options: { storage?: StorageLike; key?: string } = {},
): ComplianceStore {
  const key = options.key ?? COMPLIANCE_STORAGE_KEY;
  const storage = resolveStorage(options.storage);
  let data: ComplianceMap = readAll(storage, key);
  const listeners = new Set<() => void>();

  const persist = () => {
    try {
      storage.setItem(key, JSON.stringify(data));
    } catch {
      /* quota / private mode */
    }
    for (const listener of listeners) listener();
  };

  const setEntry = (entryKey: string, checked: boolean) => {
    if (checked) {
      if (data[entryKey]) return;
      data = { ...data, [entryKey]: true };
    } else {
      if (!data[entryKey]) return;
      const next = { ...data };
      delete next[entryKey];
      data = next;
    }
    persist();
  };

  return {
    key,
    isChecked: (date, medicationId, slot) => Boolean(data[makeEntryKey(date, medicationId, slot)]),
    setChecked: (date, medicationId, slot, checked) => {
      setEntry(makeEntryKey(date, medicationId, slot), checked);
    },
    toggle: (date, medicationId, slot) => {
      const entryKey = makeEntryKey(date, medicationId, slot);
      const next = !data[entryKey];
      setEntry(entryKey, next);
      return next;
    },
    getDaySummary: (date, expected) => {
      let checked = 0;
      for (const item of expected) {
        if (data[makeEntryKey(date, item.medicationId, item.slot)]) checked += 1;
      }
      return { checked, total: expected.length };
    },
    getStreak: (expected, referenceIso, maxDays = 90) => {
      if (expected.length === 0) return 0;
      let streak = 0;
      let cursor = referenceIso;
      let checkingToday = true;
      for (let i = 0; i < maxDays; i++) {
        const allChecked = expected.every((item) =>
          Boolean(data[makeEntryKey(cursor, item.medicationId, item.slot)]),
        );
        if (!allChecked) {
          if (checkingToday) {
            checkingToday = false;
            cursor = addDays(cursor, -1);
            continue;
          }
          break;
        }
        checkingToday = false;
        streak += 1;
        cursor = addDays(cursor, -1);
      }
      return streak;
    },
    prune: (referenceIso, keepDays = 120) => {
      const cutoff = addDays(referenceIso, -keepDays);
      const next: ComplianceMap = {};
      let changed = false;
      for (const entryKey of Object.keys(data)) {
        const entryDate = dateFromEntryKey(entryKey);
        if (entryDate >= cutoff) {
          next[entryKey] = true;
        } else {
          changed = true;
        }
      }
      if (changed) {
        data = next;
        persist();
      }
    },
    clear: () => {
      data = {};
      persist();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      listeners.clear();
    },
  };
}

let singleton: ComplianceStore | undefined;

/** App-wide store. Islands import this; tests should call createComplianceStore(). */
export function getComplianceStore(): ComplianceStore {
  if (!singleton) singleton = createComplianceStore();
  return singleton;
}

export function resetComplianceStoreForTests(): void {
  singleton?.destroy();
  singleton = undefined;
}
