"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorageState<T>(key: string, fallback: T) {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : fallbackRef.current);
    } catch {
      setValue(fallbackRef.current);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  const saveValue = useCallback(
    (nextValue: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof nextValue === "function" ? (nextValue as (current: T) => T)(current) : nextValue;
        window.localStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  return [value, saveValue, hydrated] as const;
}
