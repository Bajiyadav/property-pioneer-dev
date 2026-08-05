import { useEffect, useState, useCallback } from "react";

const NEW_KEY = "urf:favorites";
const LEGACY_KEY = "nestwise:favorites";

function migrateFavorites(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = window.localStorage.getItem(NEW_KEY);
    if (!existing) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        window.localStorage.setItem(NEW_KEY, legacy);
        const verify = window.localStorage.getItem(NEW_KEY);
        if (verify === legacy) {
          window.localStorage.removeItem(LEGACY_KEY);
        }
      }
    }
  } catch {
    // Ignore storage quota or access errors gracefully
  }
}

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    migrateFavorites();
    const raw = window.localStorage.getItem(NEW_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === NEW_KEY || e.key === LEGACY_KEY) {
        setIds(read());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(NEW_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle };
}