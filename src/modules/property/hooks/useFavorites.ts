import { STORAGE_KEYS } from "@/config/storage";
import { useEffect, useState, useCallback } from "react";

function migrateFavorites(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!existing) {
      const legacy = window.localStorage.getItem(STORAGE_KEYS.LEGACY_FAVORITES);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEYS.FAVORITES, legacy);
        const verify = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (verify === legacy) {
          window.localStorage.removeItem(STORAGE_KEYS.LEGACY_FAVORITES);
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
    const raw = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
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
      if (e.key === STORAGE_KEYS.FAVORITES || e.key === STORAGE_KEYS.LEGACY_FAVORITES) {
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
        window.localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle };
}
