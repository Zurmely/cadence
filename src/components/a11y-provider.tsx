"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_A11Y, loadA11y, saveA11y, type A11yPrefs } from "@/lib/storage";

type A11yContextValue = {
  prefs: A11yPrefs;
  setPref: <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => void;
};

const A11yContext = createContext<A11yContextValue>({
  prefs: DEFAULT_A11Y,
  setPref: () => {},
});

export function A11yProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_A11Y);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loadA11y());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("large-print", prefs.largePrint);
    root.classList.toggle("high-contrast", prefs.highContrast);
  }, [prefs]);

  const setPref = useCallback<A11yContextValue["setPref"]>((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveA11y(next);
      return next;
    });
  }, []);

  return (
    <A11yContext.Provider value={{ prefs, setPref }}>{children}</A11yContext.Provider>
  );
}

export function useA11y() {
  return useContext(A11yContext);
}
