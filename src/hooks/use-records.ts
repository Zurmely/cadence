"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadRecords, saveRecords, StorageError } from "@/lib/storage";
import { mergeRecords } from "@/lib/record-transfer";
import { newRecord, SELF_RECORD_ID, type HealthRecord } from "@/lib/types";

export type RecordsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; records: HealthRecord[] };

export function useRecords() {
  const [state, setState] = useState<RecordsState>({ status: "loading" });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // localStorage is only available after mount; this is a one-time hydration.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "ready", records: loadRecords() });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof StorageError ? e.message : "Something went wrong.",
      });
    }
  }, []);

  const persist = useCallback((next: HealthRecord[]) => {
    setState({ status: "ready", records: next });
    try {
      saveRecords(next);
      setSaveError(null);
    } catch (e) {
      setSaveError(e instanceof StorageError ? e.message : "Could not save.");
    }
  }, []);

  const upsert = useCallback(
    (record: HealthRecord) => {
      if (state.status !== "ready") return;
      const stamped = { ...record, updatedAt: new Date().toISOString() };
      const exists = state.records.some((r) => r.id === record.id);
      persist(
        exists
          ? state.records.map((r) => (r.id === record.id ? stamped : r))
          : [...state.records, stamped]
      );
    },
    [state, persist]
  );

  const remove = useCallback(
    (id: string) => {
      if (state.status !== "ready") return;
      persist(state.records.filter((r) => r.id !== id));
    },
    [state, persist]
  );

  const resetAll = useCallback(() => persist([]), [persist]);

  const importRecords = useCallback(
    (records: HealthRecord[]) => {
      if (state.status !== "ready") return;
      persist(mergeRecords(state.records, records));
    },
    [state, persist]
  );

  return { state, saveError, upsert, remove, resetAll, importRecords };
}

/** Loads one record, creating it in memory if missing. Autosaves with a short debounce. */
export function useRecord(id: string, kind: HealthRecord["kind"]) {
  const { state, saveError, upsert } = useRecords();
  const [draft, setDraft] = useState<HealthRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status !== "ready" || draft) return;
    const found = state.records.find((r) => r.id === id);
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(found);
    } else if (id === SELF_RECORD_ID) {
      setDraft(newRecord("self", SELF_RECORD_ID));
      setIsNew(true);
    } else {
      setIsNew(true);
    }
  }, [state, id, kind, draft]);

  const update = useCallback(
    (patch: (r: HealthRecord) => HealthRecord) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = patch(prev);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => upsert(next), 400);
        return next;
      });
    },
    [upsert]
  );

  const notFound =
    state.status === "ready" && !draft && isNew && id !== SELF_RECORD_ID;

  return { state, draft, update, saveError, notFound };
}
